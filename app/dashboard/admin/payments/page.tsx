"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { BookOpen, CreditCard, Download, Filter, Home, LogOut, Search, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

interface Payment {
  id: number
  student_name: string
  student_id: number
  student_roll_number: string
  exam_name: string
  exam_id: number
  amount: number
  status: string
  payment_date: string
  transaction_id: string
  payment_method: string
}

export default function AdminPaymentsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [examFilter, setExamFilter] = useState("all")
  const [payments, setPayments] = useState<Payment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const router = useRouter()

  // Fetch payments from the API
  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setIsLoading(true)
        
        // Get the JWT token from localStorage
        const token = localStorage.getItem('token')
        
        if (!token) {
          toast({
            title: 'Authentication Error',
            description: 'You must be logged in to view payments',
            variant: 'destructive',
          })
          router.push('/login')
          return
        }
        
        const response = await fetch("http://localhost:3001/api/payments", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        })
        
        if (!response.ok) {
          throw new Error(`Failed to fetch payments: ${response.status} ${response.statusText}`)
        }
        
        const data = await response.json()
        
        if (data.success && Array.isArray(data.data)) {
          setPayments(data.data)
        } else {
          console.error("Invalid payment data format:", data)
          throw new Error('Received invalid data format from server')
        }
      } catch (error) {
        console.error("Error fetching payments:", error)
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to fetch payments',
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchPayments()
  }, [toast, router])

  // Filter payments based on search term and filters
  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      (payment.student_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (payment.student_roll_number?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (payment.transaction_id?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || payment.status === statusFilter
    const matchesExam = examFilter === "all" || (payment.exam_id?.toString() || '') === examFilter
    return matchesSearch && matchesStatus && matchesExam
  })

  // Get unique exam IDs for filter
  const uniqueExamIds = [...new Set(payments.filter(payment => payment.exam_id).map(payment => payment.exam_id.toString()))]
  
  // Format date to local string
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  // Update the handleDownloadReceipt function to properly generate a receipt
  const handleDownloadReceipt = (paymentId: number) => {
    const payment = payments.find((p) => p.id === paymentId)
    if (!payment) return

    // In a real app, this would generate a PDF receipt
    // For demo purposes, we'll simulate a download

    // Show a loading toast
    toast({
      title: "Generating Receipt",
      description: "Please wait while we generate the receipt...",
    })

    // Simulate processing delay
    setTimeout(() => {
      // Create a simple text receipt
      const receiptContent = `
      RECEIPT
      -------
      Transaction ID: ${payment.transaction_id || 'N/A'}
      Date: ${payment.payment_date ? formatDate(payment.payment_date) : 'N/A'}
      Student: ${payment.student_name || 'Unknown'} (${payment.student_roll_number || 'N/A'})
      Exam: ${payment.exam_name || 'Unknown Exam'} (ID: ${payment.exam_id || 'N/A'})
      Amount: ₹${payment.amount || '0'}
      Payment Method: ${payment.payment_method || 'N/A'}
      Status: ${payment.status || 'Unknown'}
    `

      // Create a Blob and download it
      const blob = new Blob([receiptContent], { type: "text/plain" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `receipt_${payment.transaction_id}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      // Show success toast
      toast({
        title: "Receipt Generated",
        description: "The receipt has been downloaded to your computer.",
      })
    }, 1000)
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    router.push("/login")
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
            <Link href="/dashboard/admin">
              <Home className="mr-2 h-4 w-4" />
              Dashboard
            </Link>
          </Button>
          <Button variant="ghost" className="w-full justify-start" asChild>
            <Link href="/dashboard/admin/exams">
              <BookOpen className="mr-2 h-4 w-4" />
              Exams
            </Link>
          </Button>
          <Button variant="ghost" className="w-full justify-start" asChild>
            <Link href="/dashboard/admin/payments">
              <CreditCard className="mr-2 h-4 w-4" />
              Payments
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
          <h1 className="text-2xl font-bold">Payment Records</h1>
          <div className="mt-4 flex items-center space-x-2 md:mt-0">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Welcome, Admin</span>
              <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                A
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col space-y-4 md:flex-row md:items-center md:space-x-4 md:space-y-0">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by student or transaction ID..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filter:</span>
          </div>
          <Select value={examFilter} onValueChange={setExamFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Exam" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Exams</SelectItem>
              {uniqueExamIds.map((examId) => {
                const examName = payments.find(p => p.exam_id.toString() === examId)?.exam_name
                return (
                  <SelectItem key={examId} value={examId}>
                    {examName || `Exam ID: ${examId}`}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
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

        {/* Loading State */}
        {isLoading ? (
          <div className="text-center py-10">
            <p>Loading payment data...</p>
          </div>
        ) : (
          /* Payments Table */
          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium">Student</th>
                    <th className="px-4 py-3 text-left font-medium">Exam</th>
                    <th className="px-4 py-3 text-left font-medium">Amount</th>
                    <th className="px-4 py-3 text-left font-medium">Date</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-left font-medium">Transaction ID</th>
                    <th className="px-4 py-3 text-left font-medium">Method</th>
                    <th className="px-4 py-3 text-left font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                        No payment records found
                      </td>
                    </tr>
                  ) : (
                    filteredPayments.map((payment) => (
                      <tr key={payment.id} className="border-b">
                        <td className="px-4 py-3">
                          <div>
                            <div className="font-medium">{payment.student_name || 'Unknown Student'}</div>
                            <div className="text-xs text-muted-foreground">{payment.student_roll_number || 'No ID'}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <div>{payment.exam_name || 'Unknown Exam'}</div>
                            <div className="text-xs text-muted-foreground">ID: {payment.exam_id || 'N/A'}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3">₹{payment.amount || 0}</td>
                        <td className="px-4 py-3">{payment.payment_date ? formatDate(payment.payment_date) : 'No date'}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              payment.status === "completed"
                                ? "bg-green-100 text-green-800"
                                : payment.status === "pending"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-red-100 text-red-800"
                            }`}
                          >
                            {payment.status || 'Unknown'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs">{payment.transaction_id || 'No ID'}</span>
                        </td>
                        <td className="px-4 py-3">{payment.payment_method || 'Unknown'}</td>
                        <td className="px-4 py-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadReceipt(payment.id)}
                            disabled={payment.status !== "completed"}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Receipt
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
