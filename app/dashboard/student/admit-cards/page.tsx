"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  BookOpen,
  Calendar,
  CreditCard,
  Download,
  Eye,
  FileText,
  Filter,
  Home,
  LogOut,
  Search,
  User,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

interface AdmitCard {
  id: number
  exam_id: number
  examName: string
  examCode: string
  examDate: string
  examTime: string
  seatNumber: string
  examCenter: string
  examRoom: string
  status: string
  registration_id?: number
}

export default function AdmitCardsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [studentName, setStudentName] = useState("")
  const [admitCards, setAdmitCards] = useState<AdmitCard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    // Get student name from localStorage
    if (typeof window !== 'undefined') {
      const name = localStorage.getItem('userName')
      setStudentName(name || "")
    }
    
    // Fetch admit card data
    fetchAdmitCards()
  }, [])

  const fetchAdmitCards = async () => {
    try {
      setIsLoading(true)
      
      // Get the student ID and token from localStorage
      const studentId = localStorage.getItem('userId')
      const token = localStorage.getItem('token')
      
      if (!studentId || !token) {
        toast({
          title: "Authentication Error",
          description: "Please log in again to view your admit cards",
          variant: "destructive",
        })
        router.push('/login')
        return
      }
      
      // Fetch registered exams that have seat allocations
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
        // Filter for paid registrations and format the data
        const formattedCards = data.data
          .filter((reg: any) => reg.payment_status === 'paid' || reg.payment_status === 'completed')
          .map((reg: any) => {
            // Update dates from 2023 to 2026 if needed
            let examDate = reg.date || reg.exam_date
            if (examDate && examDate.includes('2023')) {
              examDate = examDate.replace('2023', '2026')
            }
            
            // Check if admit card is available (seat allocated)
            const hasSeatAllocation = reg.seat_number && reg.seat_number !== 'Pending'
            
            return {
              id: reg.id, // registration id
              exam_id: reg.exam_id,
              examName: reg.exam_title || reg.exam_name,
              examCode: `EXAM-${reg.exam_id}`,
              examDate: examDate,
              examTime: reg.time || '9:00 AM',
              seatNumber: reg.seat_number || 'Pending',
              examCenter: reg.exam_center || 'Pending',
              examRoom: reg.exam_room || 'Pending',
              status: hasSeatAllocation ? 'available' : 'pending',
              registration_id: reg.id
            }
          })
        
        setAdmitCards(formattedCards)
      } else {
        console.error("Invalid admit card data format:", data)
        toast({
          title: "Data Error",
          description: "Received invalid data format from server",
          variant: "destructive",
        })
      }
      
      setIsLoading(false)
    } catch (error) {
      console.error("Error fetching admit cards:", error)
      toast({
        title: "Error",
        description: "Failed to fetch admit cards",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  // Filter admit cards based on search term and status filter
  const filteredAdmitCards = admitCards.filter((card) => {
    const matchesSearch =
      card.examName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.examCode.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || card.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleDownloadAdmitCard = async (cardId: number, examId: number) => {
    try {
      // Get the student ID and token from localStorage
      const studentId = localStorage.getItem('userId')
      const token = localStorage.getItem('token')
      
      if (!studentId || !token) {
        toast({
          title: "Authentication Error",
          description: "Please log in again to download admit card",
          variant: "destructive",
        })
        router.push('/login')
        return
      }
      
      // Show loading toast
      toast({
        title: "Loading Admit Card",
        description: "Please wait while we fetch your admit card...",
      })
      
      // First verify the payment status again and get admit card data
      const response = await fetch(`http://localhost:3001/api/exams/admit-card/${examId}/${studentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `Failed to download admit card: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.message || "Failed to generate admit card")
      }
      
      // Create a printable admit card in a new window
      const admitCardWindow = window.open('', '_blank')
      
      if (!admitCardWindow) {
        toast({
          title: "Pop-up Blocked",
          description: "Please allow pop-ups to view your admit card",
          variant: "destructive",
        })
        return
      }

      // Format date for display
      let examDate = data.data.examDate
      if (examDate && examDate.includes('2023')) {
        examDate = examDate.replace('2023', '2026')
      }
      
      // Create the admit card HTML
      const admitCardHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Admit Card - ${data.data.examName}</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              margin: 0;
              padding: 20px;
            }
            .admit-card {
              max-width: 800px;
              margin: 0 auto;
              border: 1px solid #000;
              padding: 20px;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
              border-bottom: 2px solid #000;
              padding-bottom: 10px;
            }
            .title {
              font-size: 24px;
              font-weight: bold;
              margin: 0;
            }
            .subtitle {
              font-size: 18px;
              margin: 5px 0;
            }
            .student-details {
              display: flex;
              margin-bottom: 20px;
            }
            .details {
              flex: 3;
            }
            .photo {
              flex: 1;
              border: 1px dashed #000;
              height: 120px;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .detail-row {
              display: flex;
              margin-bottom: 5px;
            }
            .label {
              font-weight: bold;
              width: 150px;
            }
            .exam-details, .venue-details {
              margin-bottom: 20px;
            }
            .section-title {
              font-size: 16px;
              font-weight: bold;
              border-bottom: 1px solid #000;
              padding-bottom: 5px;
              margin-bottom: 10px;
            }
            .instructions {
              margin-bottom: 20px;
            }
            .instructions ol {
              margin-left: 20px;
              padding-left: 0;
            }
            .signatures {
              display: flex;
              justify-content: space-between;
              margin-top: 50px;
            }
            .signature {
              text-align: center;
              width: 200px;
            }
            .sig-line {
              border-top: 1px solid #000;
              margin-bottom: 5px;
            }
            .print-button {
              background-color: #4CAF50;
              color: white;
              padding: 10px 15px;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              font-size: 16px;
              margin-bottom: 20px;
            }
            @media print {
              .print-button {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <button class="print-button" onclick="window.print()">Print Admit Card</button>
          
          <div class="admit-card">
            <div class="header">
              <h1 class="title">EXAM REGISTRATION SYSTEM</h1>
              <h2 class="subtitle">ADMIT CARD</h2>
            </div>
            
            <div class="student-details">
              <div class="details">
                <div class="detail-row">
                  <div class="label">Student Name:</div>
                  <div>${data.data.studentName}</div>
                </div>
                <div class="detail-row">
                  <div class="label">Roll Number:</div>
                  <div>${data.data.studentId}</div>
                </div>
                <div class="detail-row">
                  <div class="label">Email:</div>
                  <div>${data.data.studentEmail}</div>
                </div>
              </div>
              <div class="photo">
                Student Photo
              </div>
            </div>
            
            <div class="exam-details">
              <h3 class="section-title">Exam Details</h3>
              <div class="detail-row">
                <div class="label">Exam Name:</div>
                <div>${data.data.examName}</div>
              </div>
              <div class="detail-row">
                <div class="label">Date:</div>
                <div>${examDate}</div>
              </div>
              <div class="detail-row">
                <div class="label">Time:</div>
                <div>${data.data.examTime}</div>
              </div>
              <div class="detail-row">
                <div class="label">Duration:</div>
                <div>${data.data.examDuration}</div>
              </div>
            </div>
            
            <div class="venue-details">
              <h3 class="section-title">Venue Information</h3>
              <div class="detail-row">
                <div class="label">Exam Center:</div>
                <div>${data.data.examCenter}</div>
              </div>
              <div class="detail-row">
                <div class="label">Room:</div>
                <div>${data.data.examRoom}</div>
              </div>
              <div class="detail-row">
                <div class="label">Seat Number:</div>
                <div><strong>${data.data.seatNumber}</strong></div>
              </div>
            </div>
            
            <div class="instructions">
              <h3 class="section-title">Instructions</h3>
              <ol>
                <li>Please arrive at the exam center 30 minutes before the scheduled time.</li>
                <li>Bring this admit card and a valid ID proof.</li>
                <li>Electronic devices are not allowed in the examination hall.</li>
                <li>Follow all instructions given by the exam supervisors.</li>
              </ol>
            </div>
            
            <div class="signatures">
              <div class="signature">
                <div class="sig-line"></div>
                <div>Student Signature</div>
              </div>
              <div class="signature">
                <div class="sig-line"></div>
                <div>Exam Controller</div>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
      
      // Write the HTML to the new window
      admitCardWindow.document.write(admitCardHTML)
      admitCardWindow.document.close()
      
      // Show success toast
      toast({
        title: "Admit Card Ready",
        description: "Your admit card has been generated successfully. You can print it from the opened window.",
      })
    } catch (error) {
      console.error("Error downloading admit card:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to download admit card",
        variant: "destructive",
      })
    }
  }

  const handleViewAdmitCard = async (cardId: number, examId: number) => {
    try {
      // Get the student ID and token from localStorage
      const studentId = localStorage.getItem('userId')
      const token = localStorage.getItem('token')
      
      if (!studentId || !token) {
        toast({
          title: "Authentication Error",
          description: "Please log in again to view admit card",
          variant: "destructive",
        })
        router.push('/login')
        return
      }
      
      // Show loading toast
      toast({
        title: "Loading Admit Card",
        description: "Please wait while we fetch your admit card...",
      })
      
      // Fetch admit card data
      const response = await fetch(`http://localhost:3001/api/exams/admit-card/${examId}/${studentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `Failed to view admit card: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.message || "Failed to generate admit card")
      }
      
      // Create a printable admit card in a new window
      const admitCardWindow = window.open('', '_blank')
      
      if (!admitCardWindow) {
        toast({
          title: "Pop-up Blocked",
          description: "Please allow pop-ups to view your admit card",
          variant: "destructive",
        })
        return
      }

      // Format date for display
      let examDate = data.data.examDate
      if (examDate && examDate.includes('2023')) {
        examDate = examDate.replace('2023', '2026')
      }
      
      // Create the admit card HTML - make it look slightly different from the download version
      const admitCardHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Admit Card - ${data.data.examName}</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              margin: 0;
              padding: 20px;
              background-color: #f5f5f5;
            }
            .admit-card {
              max-width: 800px;
              margin: 0 auto;
              border: 1px solid #000;
              padding: 20px;
              background-color: white;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
              border-bottom: 2px solid #000;
              padding-bottom: 10px;
            }
            .title {
              font-size: 24px;
              font-weight: bold;
              margin: 0;
              color: #222;
            }
            .subtitle {
              font-size: 18px;
              margin: 5px 0;
              color: #555;
            }
            .student-details {
              display: flex;
              margin-bottom: 20px;
            }
            .details {
              flex: 3;
            }
            .photo {
              flex: 1;
              border: 1px dashed #000;
              height: 120px;
              display: flex;
              align-items: center;
              justify-content: center;
              background-color: #f9f9f9;
            }
            .detail-row {
              display: flex;
              margin-bottom: 5px;
            }
            .label {
              font-weight: bold;
              width: 150px;
              color: #555;
            }
            .exam-details, .venue-details {
              margin-bottom: 20px;
            }
            .section-title {
              font-size: 16px;
              font-weight: bold;
              border-bottom: 1px solid #000;
              padding-bottom: 5px;
              margin-bottom: 10px;
              color: #333;
            }
            .instructions {
              margin-bottom: 20px;
              background-color: #f9f9f9;
              padding: 10px;
              border-radius: 4px;
            }
            .instructions ol {
              margin-left: 20px;
              padding-left: 0;
            }
            .signatures {
              display: flex;
              justify-content: space-between;
              margin-top: 50px;
            }
            .signature {
              text-align: center;
              width: 200px;
            }
            .sig-line {
              border-top: 1px solid #000;
              margin-bottom: 5px;
            }
            .print-button {
              background-color: #4CAF50;
              color: white;
              padding: 10px 15px;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              font-size: 16px;
              margin-bottom: 20px;
            }
            .close-button {
              background-color: #f44336;
              color: white;
              padding: 10px 15px;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              font-size: 16px;
              margin-bottom: 20px;
              margin-left: 10px;
            }
            .button-container {
              display: flex;
              justify-content: flex-start;
              margin-bottom: 20px;
            }
            @media print {
              .button-container {
                display: none;
              }
              body {
                background-color: white;
                padding: 0;
              }
              .admit-card {
                box-shadow: none;
                border: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="button-container">
            <button class="print-button" onclick="window.print()">Print Admit Card</button>
            <button class="close-button" onclick="window.close()">Close Window</button>
          </div>
          
          <div class="admit-card">
            <div class="header">
              <h1 class="title">EXAM REGISTRATION SYSTEM</h1>
              <h2 class="subtitle">ADMIT CARD</h2>
            </div>
            
            <div class="student-details">
              <div class="details">
                <div class="detail-row">
                  <div class="label">Student Name:</div>
                  <div>${data.data.studentName}</div>
                </div>
                <div class="detail-row">
                  <div class="label">Roll Number:</div>
                  <div>${data.data.studentId}</div>
                </div>
                <div class="detail-row">
                  <div class="label">Email:</div>
                  <div>${data.data.studentEmail}</div>
                </div>
              </div>
              <div class="photo">
                Student Photo
              </div>
            </div>
            
            <div class="exam-details">
              <h3 class="section-title">Exam Details</h3>
              <div class="detail-row">
                <div class="label">Exam Name:</div>
                <div>${data.data.examName}</div>
              </div>
              <div class="detail-row">
                <div class="label">Date:</div>
                <div>${examDate}</div>
              </div>
              <div class="detail-row">
                <div class="label">Time:</div>
                <div>${data.data.examTime}</div>
              </div>
              <div class="detail-row">
                <div class="label">Duration:</div>
                <div>${data.data.examDuration}</div>
              </div>
            </div>
            
            <div class="venue-details">
              <h3 class="section-title">Venue Information</h3>
              <div class="detail-row">
                <div class="label">Exam Center:</div>
                <div>${data.data.examCenter}</div>
              </div>
              <div class="detail-row">
                <div class="label">Room:</div>
                <div>${data.data.examRoom}</div>
              </div>
              <div class="detail-row">
                <div class="label">Seat Number:</div>
                <div><strong>${data.data.seatNumber}</strong></div>
              </div>
            </div>
            
            <div class="instructions">
              <h3 class="section-title">Instructions</h3>
              <ol>
                <li>Please arrive at the exam center 30 minutes before the scheduled time.</li>
                <li>Bring this admit card and a valid ID proof.</li>
                <li>Electronic devices are not allowed in the examination hall.</li>
                <li>Follow all instructions given by the exam supervisors.</li>
              </ol>
            </div>
            
            <div class="signatures">
              <div class="signature">
                <div class="sig-line"></div>
                <div>Student Signature</div>
              </div>
              <div class="signature">
                <div class="sig-line"></div>
                <div>Exam Controller</div>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
      
      // Write the HTML to the new window
      admitCardWindow.document.write(admitCardHTML)
      admitCardWindow.document.close()
      
      // Show success toast
      toast({
        title: "Admit Card Loaded",
        description: "Your admit card has been opened in a new window.",
      })
    } catch (error) {
      console.error("Error viewing admit card:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to view admit card",
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
          <Button variant="ghost" className="w-full justify-start" asChild>
            <Link href="/dashboard/student/payments">
              <CreditCard className="mr-2 h-4 w-4" />
              Payments
            </Link>
          </Button>
          <Button variant="ghost" className="w-full justify-start bg-accent" asChild>
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
          <h1 className="text-2xl font-bold">Admit Cards</h1>
          <div className="mt-4 flex items-center space-x-2 md:mt-0">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Welcome, {studentName}</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                {studentName ? studentName.split(' ').map(n => n[0]).join('').toUpperCase() : ''}
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 flex flex-col space-y-4 md:flex-row md:items-center md:space-x-4 md:space-y-0">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by exam name or code..."
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
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="text-center py-20">
            <p>Loading admit cards...</p>
          </div>
        ) : filteredAdmitCards.length === 0 ? (
          <div className="text-center py-20">
            <h3 className="text-lg font-medium">No Admit Cards Found</h3>
            <p className="text-muted-foreground mt-2">
              {statusFilter !== "all" 
                ? `No ${statusFilter} admit cards match your search.` 
                : "You don't have any admit cards yet. Register for exams and complete payments to receive admit cards."}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredAdmitCards.map((card) => (
              <Card key={card.id} className={card.status === "pending" ? "opacity-70" : ""}>
                <CardHeader>
                  <CardTitle>{card.examName}</CardTitle>
                  <CardDescription>
                    <span className="inline-block rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      {card.examCode}
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>
                        {card.examDate} at {card.examTime}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Seat Number:</span>
                      <span>{card.seatNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Exam Center:</span>
                      <span>{card.examCenter}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Room:</span>
                      <span>{card.examRoom}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <span className={`capitalize ${card.status === "available" ? "text-green-500" : "text-amber-500"}`}>
                        {card.status}
                      </span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between gap-2">
                  {card.status === "available" ? (
                    <>
                      <Button variant="outline" className="flex-1" onClick={() => handleViewAdmitCard(card.id, card.exam_id)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </Button>
                      <Button className="flex-1" onClick={() => handleDownloadAdmitCard(card.id, card.exam_id)}>
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </Button>
                    </>
                  ) : (
                    <Button className="w-full" disabled>
                      Not Available Yet
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
