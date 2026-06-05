"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { BookOpen, CreditCard, Download, FileText, Filter, Home, LogOut, Loader2, Search, User } from "lucide-react"
import { jsPDF } from "jspdf"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"

interface Payment {
  id: number
  registration_id: number
  exam_id: number
  exam_name: string
  exam_code: string
  amount: number
  payment_date: string
  status: string
  transaction_id: string
  payment_method: string
}

interface PendingPayment {
  id: number
  registration_id: number
  exam_id: number
  exam_name: string
  exam_code: string
  amount: number
  due_date: string
}

export default function PaymentsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [studentName, setStudentName] = useState("")
  const [payments, setPayments] = useState<Payment[]>([])
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    // Get student name from localStorage
    if (typeof window !== 'undefined') {
      const name = localStorage.getItem('userName')
      setStudentName(name || "")
    }
    
    // Fetch payment data
    fetchPayments()
    fetchPendingPayments()
  }, [])

  const fetchPayments = async () => {
    try {
      setIsLoading(true)
      
      // Get student ID and token from localStorage
      const studentId = localStorage.getItem('userId')
      const token = localStorage.getItem('token')
      
      if (!studentId || !token) {
        toast({
          title: "Authentication Error",
          description: "Please log in again to view your payments",
          variant: "destructive",
        })
        router.push('/login')
        return
      }
      
      // Fetch completed payments
      const response = await fetch(`http://localhost:3001/api/payments?student_id=${studentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch payments: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      
      if (data.success && Array.isArray(data.data)) {
        // Format payment data
        const formattedPayments = data.data
          .filter((payment: any) => payment.status === 'completed' || payment.status === 'paid')
          .map((payment: any) => {
            // Update dates from 2023 to 2026 if needed
            let paymentDate = payment.payment_date
            if (paymentDate && paymentDate.includes('2023')) {
              paymentDate = paymentDate.replace('2023', '2026')
            }
            
            return {
              id: payment.id,
              registration_id: payment.registration_id,
              exam_id: payment.exam_id,
              exam_name: payment.exam_name || payment.exam_title || "Exam",
              exam_code: payment.exam_code || `EXAM-${payment.exam_id}`,
              amount: payment.amount,
              payment_date: paymentDate,
              status: payment.status,
              transaction_id: payment.transaction_id || `TRX-${payment.id}`,
              payment_method: payment.payment_method || "Online Payment"
            }
          })
        
        setPayments(formattedPayments)
      }
      
      setIsLoading(false)
    } catch (error) {
      console.error("Error fetching payments:", error)
      toast({
        title: "Error",
        description: "Failed to fetch payment data",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }
  
  const fetchPendingPayments = async () => {
    try {
      // Get student ID and token from localStorage
      const studentId = localStorage.getItem('userId')
      const token = localStorage.getItem('token')
      
      if (!studentId || !token) {
        return // Already handled in fetchPayments
      }
      
      // Fetch registrations that don't have a payment yet
      const response = await fetch(`http://localhost:3001/api/exams/student/registrations?student_id=${studentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch registrations: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      
      if (data.success && Array.isArray(data.data)) {
        // Filter for unpaid registrations
        const unpaidRegistrations = data.data.filter((reg: any) => {
          return reg.payment_status !== 'paid' && reg.payment_status !== 'completed'
        })
        
        // Format as pending payments
        const pendingPaymentsData = unpaidRegistrations.map((reg: any) => {
          // Calculate due date (registration date + 7 days)
          let dueDate = new Date(reg.registration_date)
          dueDate.setDate(dueDate.getDate() + 7)
          
          // Update dates from 2023 to 2026 if needed
          let dueDateStr = dueDate.toISOString().split('T')[0]
          if (dueDateStr && dueDateStr.includes('2023')) {
            dueDateStr = dueDateStr.replace('2023', '2026')
          }
          
          return {
            id: reg.id, // registration ID
            registration_id: reg.id,
            exam_id: reg.exam_id,
            exam_name: reg.exam_title || reg.exam_name || "Exam",
            exam_code: `EXAM-${reg.exam_id}`,
            amount: reg.fee,
            due_date: dueDateStr
          }
        })
        
        setPendingPayments(pendingPaymentsData)
      }
    } catch (error) {
      console.error("Error fetching pending payments:", error)
      toast({
        title: "Error",
        description: "Failed to fetch pending payments",
        variant: "destructive",
      })
    }
  }

  // Filter payments based on search term and status filter
  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      payment.exam_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.transaction_id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || payment.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Process payment for an exam
  const handlePayNow = async (registrationId: number) => {
    try {
      // Find the payment in pending payments
      const payment = pendingPayments.find(p => p.registration_id === registrationId)
      if (!payment) {
        toast({
          title: "Error",
          description: "Payment information not found",
          variant: "destructive",
        })
        return
      }
      
      setIsProcessingPayment(true)
      
      // Get token from localStorage
      const token = localStorage.getItem('token')
      const studentId = localStorage.getItem('userId')
      
      if (!token || !studentId) {
        toast({
          title: "Authentication Error",
          description: "Please log in again to make a payment",
          variant: "destructive",
        })
        router.push('/login')
        return
      }
      
      // Show a loading toast
      toast({
        title: "Processing Payment",
        description: "Please wait while we process your payment...",
      })
      
      // Process payment via API
      const response = await fetch('http://localhost:3001/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          registration_id: payment.registration_id,
          amount: payment.amount,
          payment_method: 'Credit Card',
          card_details: 'Visa ending in 4242'
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `Payment failed: ${response.status}`)
      }
      
      const data = await response.json()
      
      // Show success toast
      toast({
        title: "Payment Successful",
        description: `Your payment of ₹${payment.amount} for ${payment.exam_name} has been processed successfully.`,
      })
      
      // Step 2: Allocate a seat automatically after payment
      try {
        toast({
          title: "Allocating Seat",
          description: "Please wait while we allocate your seat...",
        })
        
        // Call the seat allocation API
        const seatResponse = await fetch('http://localhost:3001/api/exams/allocate-seat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            registration_id: payment.registration_id,
            exam_id: payment.exam_id,
            student_id: studentId
          })
        })
        
        if (!seatResponse.ok) {
          console.error("Seat allocation warning:", await seatResponse.text())
          toast({
            title: "Seat Allocation Pending",
            description: "Your payment was successful, but seat allocation is pending. Check back later to download your admit card.",
          })
        } else {
          const seatData = await seatResponse.json()
          
          // Seat allocated successfully, show success message
          toast({
            title: "Seat Allocated",
            description: "Your seat has been allocated successfully. Your admit card is now ready.",
          })
          
          // Show a separate toast with instructions to view the admit card
          setTimeout(() => {
            toast({
              title: "Admit Card Ready",
              description: "Your admit card is ready. Click 'View Admit Cards' in the sidebar to view and download it.",
              duration: 8000,
            })
          }, 1000)
          
          // After a short delay, automatically navigate to the admit cards page
          setTimeout(() => {
            // Clear any cached exam data to ensure we get fresh data showing admit card is available
            localStorage.removeItem('examsCache')
            localStorage.removeItem('registrationsCache')
            
            // Force refresh the student's data before redirecting
            fetch(`http://localhost:3001/api/exams/student/registrations?student_id=${studentId}&forceRefresh=true`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            }).then(response => {
              // Regardless of response, navigate to admit cards page
              router.push('/dashboard/student/admit-cards')
            }).catch(err => {
              console.error("Error refreshing registrations data:", err)
              // Still navigate even if refresh fails
              router.push('/dashboard/student/admit-cards')
            })
          }, 3000)
        }
      } catch (seatError) {
        console.error("Seat allocation error:", seatError)
        toast({
          title: "Seat Allocation Pending",
          description: "Your payment was successful, but we couldn't allocate a seat automatically. Please check back later.",
          variant: "default",
        })
      }
      
      // Refresh payment data
      fetchPayments()
      fetchPendingPayments()
      
      setIsProcessingPayment(false)
    } catch (error) {
      console.error("Payment error:", error)
      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : "An error occurred during payment",
        variant: "destructive",
      })
      setIsProcessingPayment(false)
    }
  }
  
  // Generate and download a receipt
  const handleDownloadReceipt = (paymentId: number) => {
    try {
      const payment = payments.find(p => p.id === paymentId)
      if (!payment) {
        toast({
          title: "Error",
          description: "Payment information not found",
          variant: "destructive",
        })
        return
      }
      
      // Show a loading toast
      toast({
        title: "Generating Receipt",
        description: "Please wait while we generate the receipt...",
      })
      
      // Create a PDF receipt
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      })
      
      // Add content to the PDF
      doc.setFontSize(20)
      doc.text("Payment Receipt", 105, 20, { align: "center" })
      
      doc.setFontSize(12)
      doc.text("Exam Registration System", 105, 30, { align: "center" })
      
      doc.setLineWidth(0.5)
      doc.line(20, 35, 190, 35)
      
      doc.setFontSize(12)
      doc.text("Receipt Details", 20, 45)
      
      doc.setFontSize(10)
      doc.text("Transaction ID:", 20, 55)
      doc.text(payment.transaction_id, 70, 55)
      
      doc.text("Date:", 20, 65)
      doc.text(new Date(payment.payment_date).toLocaleDateString(), 70, 65)
      
      doc.text("Exam:", 20, 75)
      doc.text(payment.exam_name, 70, 75)
      
      doc.text("Exam Code:", 20, 85)
      doc.text(payment.exam_code, 70, 85)
      
      doc.text("Amount:", 20, 95)
      doc.text(`₹${payment.amount}`, 70, 95)
      
      doc.text("Payment Method:", 20, 105)
      doc.text(payment.payment_method, 70, 105)
      
      doc.text("Status:", 20, 115)
      doc.text(payment.status, 70, 115)
      
      doc.setLineWidth(0.5)
      doc.line(20, 125, 190, 125)
      
      doc.setFontSize(10)
      doc.text("This is a computer-generated receipt and does not require a signature.", 105, 135, {
        align: "center",
      })
      doc.text("Thank you for your payment!", 105, 145, { align: "center" })
      
      // Save the PDF
      doc.save(`receipt_${payment.transaction_id}.pdf`)
      
      toast({
        title: "Receipt Downloaded",
        description: "The receipt has been downloaded successfully.",
      })
    } catch (error) {
      console.error("Error generating PDF:", error)
      toast({
        title: "Error",
        description: "Failed to generate receipt. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleLogout = () => {
    // Clear authentication data from localStorage
    localStorage.removeItem('token')
    localStorage.removeItem('userId')
    localStorage.removeItem('userRole')
    localStorage.removeItem('userName')
    localStorage.removeItem('examsCache')
    localStorage.removeItem('registrationsCache')
    
    // Redirect to login page
    router.push("/auth/login")
  }

  return (
    <div className="flex min-h-screen bg-muted/40">
      {/* Sidebar */}
      <div className="hidden w-64 flex-col bg-card p-4 shadow-md md:flex">
        <div className="mb-8 flex items-center space-x-2">
          <div className="text-xl font-bold">
            <span className="text-primary">Exam</span>
            <span>Registration</span>
          </div>
        </div>
        <nav className="flex-1 space-y-2">
          <Button variant="ghost" className="w-full justify-start" asChild>
            <Link href="/dashboard/student">
              <Home className="mr-2 h-4 w-4" />
              Dashboard
            </Link>
          </Button>
          <Button variant="ghost" className="w-full justify-start" asChild>
            <Link href="/dashboard/student/profile">
              <User className="mr-2 h-4 w-4" />
              Profile
            </Link>
          </Button>
          <Button variant="ghost" className="w-full justify-start" asChild>
            <Link href="/dashboard/student/exams">
              <BookOpen className="mr-2 h-4 w-4" />
              Exams
            </Link>
          </Button>
          <Button variant="ghost" className="w-full justify-start bg-accent" asChild>
            <Link href="/dashboard/student/payments">
              <CreditCard className="mr-2 h-4 w-4" />
              Payments
            </Link>
          </Button>
          <Button variant="ghost" className="w-full justify-start" asChild>
            <Link href="/dashboard/student/admit-cards">
              <FileText className="mr-2 h-4 w-4" />
              Admit Cards
            </Link>
          </Button>
        </nav>
        <div className="pt-4">
          <Button variant="outline" className="w-full justify-start" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 p-4 md:p-6">
        <div className="mb-6 flex flex-col justify-between md:flex-row md:items-center">
          <h1 className="text-2xl font-bold">Payments</h1>
          <div className="mt-4 flex items-center space-x-2 md:mt-0">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Welcome, {studentName}</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                {studentName ? studentName.split(' ').map(n => n[0]).join('').toUpperCase() : ''}
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pending">Pending Payments</TabsTrigger>
            <TabsTrigger value="history">Payment History</TabsTrigger>
          </TabsList>

          {/* Pending Payments Tab */}
          <TabsContent value="pending" className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                <span>Loading payment data...</span>
              </div>
            ) : pendingPayments.length === 0 ? (
              <Card>
                <CardHeader className="text-center">
                  <CardTitle>No Pending Payments</CardTitle>
                  <CardDescription>You don't have any pending payments at the moment.</CardDescription>
                </CardHeader>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {pendingPayments.map((payment) => (
                  <Card key={payment.id}>
                    <CardHeader>
                      <CardTitle>{payment.exam_name}</CardTitle>
                      <CardDescription>
                        <span className="inline-block rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          {payment.exam_code}
                        </span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Amount:</span>
                          <span className="font-medium">₹{payment.amount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Due Date:</span>
                          <span className="font-medium">{new Date(payment.due_date).toLocaleDateString()}</span>
                        </div>
                        <div className="mt-4">
                          <Button 
                            className="w-full" 
                            onClick={() => handlePayNow(payment.registration_id)}
                            disabled={isProcessingPayment}
                          >
                            {isProcessingPayment ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              "Pay Now"
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Payment History Tab */}
          <TabsContent value="history" className="space-y-4">
            <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-x-4 md:space-y-0">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by exam or transaction ID..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filter:</span>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-md border">
              {isLoading ? (
                <div className="flex items-center justify-center py-24">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  <span>Loading payment history...</span>
                </div>
              ) : filteredPayments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <p className="text-lg font-medium">No Payment Records Found</p>
                  <p className="text-muted-foreground">
                    {searchTerm || statusFilter !== "all" 
                      ? "Try adjusting your search or filter criteria" 
                      : "You haven't made any payments yet"}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-4 py-3 text-left font-medium">Exam</th>
                        <th className="px-4 py-3 text-left font-medium">Amount</th>
                        <th className="px-4 py-3 text-left font-medium">Date</th>
                        <th className="px-4 py-3 text-left font-medium">Status</th>
                        <th className="px-4 py-3 text-left font-medium">Transaction ID</th>
                        <th className="px-4 py-3 text-left font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPayments.map((payment) => (
                        <tr key={payment.id} className="border-b">
                          <td className="px-4 py-3">
                            <div>
                              <div className="font-medium">{payment.exam_name}</div>
                              <div className="text-xs text-muted-foreground">{payment.exam_code}</div>
                            </div>
                          </td>
                          <td className="px-4 py-3">₹{payment.amount}</td>
                          <td className="px-4 py-3">{new Date(payment.payment_date).toLocaleDateString()}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                payment.status === "completed" || payment.status === "paid"
                                  ? "bg-green-100 text-green-800"
                                  : payment.status === "pending"
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-red-100 text-red-800"
                              }`}
                            >
                              {payment.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-mono text-xs">{payment.transaction_id}</span>
                          </td>
                          <td className="px-4 py-3">
                            <Button variant="ghost" size="sm" onClick={() => handleDownloadReceipt(payment.id)}>
                              <Download className="mr-2 h-4 w-4" />
                              Receipt
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
