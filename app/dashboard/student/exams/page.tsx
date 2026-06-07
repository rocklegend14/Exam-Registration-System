"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  BookOpen,
  Calendar,
  CreditCard,
  Download,
  FileText,
  Filter,
  Home,
  Info,
  LogOut,
  Search,
  User,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"

export default function ExamsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [subjectFilter, setSubjectFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")
  const [selectedExam, setSelectedExam] = useState<any>(null)
  const [isExamDetailsOpen, setIsExamDetailsOpen] = useState(false)
  const [availableExams, setAvailableExams] = useState<any[]>([])
  const [registeredExams, setRegisteredExams] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [studentName, setStudentName] = useState("")
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    // Get student name from localStorage
    if (typeof window !== 'undefined') {
      const name = localStorage.getItem('userName')
      setStudentName(name || "")
    }
    
    // Fetch available exams - this would be replaced with a real API call
    fetchAvailableExams()
    fetchRegisteredExams()
  }, [])
  
  const fetchAvailableExams = async () => {
    try {
      setIsLoading(true)
      
      // Get the student ID and token from localStorage
      const studentId = localStorage.getItem('userId')
      const token = localStorage.getItem('token')
      
      if (!studentId || !token) {
        toast({
          title: "Authentication Error",
          description: "Please log in again to view your exams",
          variant: "destructive",
        })
        router.push('/login')
        return
      }
      
      // Fetch available exams from the API
      const response = await fetch('https://exam-registration-system-6ncs.onrender.com/api/exams', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch exams: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      
      if (data.success && Array.isArray(data.data)) {
        // Update exam dates to 2026 and map the response data to the expected format
        const formattedExams = data.data.map((exam: any) => {
          // Update dates from 2023 to 2026 if needed
          let examDate = exam.date
          if (examDate && examDate.includes('2023')) {
            examDate = examDate.replace('2023', '2026')
          }
          
          return {
            id: exam.id,
            name: exam.name,
            code: exam.id.toString(), // Use ID as code if not provided
            date: examDate,
            time: exam.time || '9:00 AM',
            duration: convertToMinutes(exam.duration),
            fee: exam.fee,
            status: exam.status || 'open',
            location: exam.venue || 'Main Campus',
            instructor: exam.instructor || 'TBD',
            description: exam.description || `Examination for ${exam.name}`,
            registration_deadline: exam.registration_deadline || examDate
          }
        })
        
        setAvailableExams(formattedExams)
      } else {
        console.error("Invalid exam data format:", data)
        toast({
          title: "Data Error",
          description: "Received invalid data format from server",
          variant: "destructive",
        })
      }
      
      setIsLoading(false)
    } catch (error) {
      console.error("Error fetching available exams:", error)
      toast({
        title: "Error",
        description: "Failed to fetch available exams",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }
  
  const fetchRegisteredExams = async () => {
    try {
      // Get the student ID and token from localStorage
      const studentId = localStorage.getItem('userId')
      const token = localStorage.getItem('token')
      
      if (!studentId || !token) {
        toast({
          title: "Authentication Error",
          description: "Please log in again to view your exams",
          variant: "destructive",
        })
        return
      }
      
      // Fetch registered exams from the API
      const response = await fetch(`https://exam-registration-system-6ncs.onrender.com/api/exams/student/registrations?student_id=${studentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch registrations: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      
      if (data.success && Array.isArray(data.data)) {
        // Format the registrations data
        const formattedRegistrations = data.data.map((reg: any) => {
          // Update dates from 2023 to 2026 if needed
          let examDate = reg.date || reg.exam_date
          if (examDate && examDate.includes('2023')) {
            examDate = examDate.replace('2023', '2026')
          }
          
          let regDate = reg.registration_date
          if (regDate && regDate.includes('2023')) {
            regDate = regDate.replace('2023', '2026')
          }
          
          // Use the admit_card_available property from the backend
          return {
            id: reg.exam_id,
            registration_id: reg.id,
            name: reg.exam_title || reg.exam_name,
            code: reg.exam_id.toString(),
            date: examDate,
            time: reg.time || '9:00 AM',
            duration: convertToMinutes(reg.duration),
            fee: reg.fee,
            status: reg.payment_status,
            seatNumber: reg.seat_number || 'Pending',
            examCenter: reg.exam_center || 'Pending',
            examRoom: reg.exam_room || 'Pending',
            admitCardAvailable: reg.admit_card_available === true,
            registrationDate: regDate || new Date().toISOString(),
          }
        })
        
        setRegisteredExams(formattedRegistrations)
      } else {
        console.error("Invalid registration data format:", data)
        toast({
          title: "Data Error",
          description: "Received invalid data format from server",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching registered exams:", error)
      toast({
        title: "Error",
        description: "Failed to fetch registered exams",
        variant: "destructive",
      })
    }
  }

  const convertToMinutes = (duration: any): string => {
    if (typeof duration === 'number') {
      return `${duration} minutes`;
    }
    
    if (typeof duration === 'string') {
      // Check if already in minutes format
      if (duration.toLowerCase().includes('minute')) {
        return duration;
      }
      
      // Convert hours to minutes
      if (duration.toLowerCase().includes('hour')) {
        const hourMatch = duration.match(/(\d+)\s*hours?/i);
        if (hourMatch && hourMatch[1]) {
          const hours = parseInt(hourMatch[1], 10);
          return `${hours * 60} minutes`;
        }
      }
      
      // If it's a simple number with "hr" or "h"
      const hourMatch = duration.match(/(\d+)\s*(?:hr|h)/i);
      if (hourMatch && hourMatch[1]) {
        const hours = parseInt(hourMatch[1], 10);
        return `${hours * 60} minutes`;
      }
      
      // Try to parse as a number
      const numMatch = duration.match(/(\d+)/);
      if (numMatch && numMatch[1]) {
        const num = parseInt(numMatch[1], 10);
        if (num <= 12) { // Assume numbers <= 12 are hours
          return `${num * 60} minutes`;
        }
        return `${num} minutes`;
      }
    }
    
    // Default value
    return '180 minutes'; // 3 hours in minutes
  }

  // Filter available exams based on search term and filters
  const filteredAvailableExams = availableExams.filter((exam) => {
    const matchesSearch =
      exam.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exam.code.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSubject = subjectFilter === "all" || exam.name.toLowerCase().includes(subjectFilter.toLowerCase())
    const matchesDate = dateFilter === "all" || exam.date === dateFilter
    return matchesSearch && matchesSubject && matchesDate
  })

  const handleRegister = async (examId: number) => {
    try {
      // Get the student ID and token from localStorage
      const studentId = localStorage.getItem('userId')
      const token = localStorage.getItem('token')
      
      if (!studentId || !token) {
        toast({
          title: "Authentication Error",
          description: "Please log in again to register for exams",
          variant: "destructive",
        })
        router.push('/login')
        return
      }
      
      // Call the API to register for the exam
      const response = await fetch('https://exam-registration-system-6ncs.onrender.com/api/exams/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          exam_id: examId,
          student_id: parseInt(studentId)
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `Failed to register: ${response.status} ${response.statusText}`)
      }
      
      // Show success message
      toast({
        title: "Registration Successful",
        description: "You have been registered for the exam. Please complete the payment.",
      })
      
      // Refresh the registered exams list
      fetchRegisteredExams()
    } catch (error) {
      console.error("Error registering for exam:", error)
      toast({
        title: "Registration Failed",
        description: error instanceof Error ? error.message : "Failed to register for the exam",
        variant: "destructive",
      })
    }
  }

  const handlePayFee = (examId: number) => {
    toast({
      title: "Payment Successful",
      description: "Your exam fee has been paid successfully.",
    })
  }

  const handleDownloadAdmitCard = async (examId: number) => {
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
      
      // Check if the student has paid for the exam
      const registration = registeredExams.find(exam => exam.id === examId)
      
      if (!registration) {
        toast({
          title: "Error",
          description: "Registration not found",
          variant: "destructive",
        })
        return
      }
      
      if (registration.status !== 'paid') {
        toast({
          title: "Payment Required",
          description: "Please pay the exam fee before downloading the admit card",
          variant: "destructive",
        })
        return
      }
      
      if (!registration.admitCardAvailable) {
        toast({
          title: "Not Available",
          description: "Admit card is not yet available for this exam",
          variant: "destructive",
        })
        return
      }
      
      // Show loading toast
      toast({
        title: "Loading Admit Card",
        description: "Please wait while we fetch your admit card...",
      })
      
      // Fetch admit card data
      const response = await fetch(`https://exam-registration-system-6ncs.onrender.com/api/exams/admit-card/${examId}/${studentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `Failed to download admit card: ${response.status}`)
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
      
      // Success message
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

  const handleViewDetails = (exam: any) => {
    setSelectedExam(exam)
    setIsExamDetailsOpen(true)
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
          <Button variant="ghost" className="w-full justify-start bg-accent" asChild>
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
          <h1 className="text-2xl font-bold">Exams</h1>
          <div className="mt-4 flex items-center space-x-2 md:mt-0">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Welcome, {studentName}</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                {studentName ? studentName.split(' ').map(n => n[0]).join('').toUpperCase() : ''}
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="available" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="available">Available Exams</TabsTrigger>
            <TabsTrigger value="registered">Registered Exams</TabsTrigger>
          </TabsList>

          {/* Available Exams Tab */}
          <TabsContent value="available" className="space-y-4">
            <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-x-4 md:space-y-0">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search exams by name or code..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filter:</span>
              </div>
              <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  <SelectItem value="mathematics">Mathematics</SelectItem>
                  <SelectItem value="physics">Physics</SelectItem>
                  <SelectItem value="computer">Computer Science</SelectItem>
                  <SelectItem value="english">English</SelectItem>
                </SelectContent>
              </Select>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Dates</SelectItem>
                  <SelectItem value="2026-06-15">June 15, 2026</SelectItem>
                  <SelectItem value="2026-06-20">June 20, 2026</SelectItem>
                  <SelectItem value="2026-06-25">June 25, 2026</SelectItem>
                  <SelectItem value="2026-06-30">June 30, 2026</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredAvailableExams.map((exam) => (
                <Card key={exam.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between">
                      <div>
                        <CardTitle>{exam.name}</CardTitle>
                        <CardDescription className="mt-1">
                          <span className="inline-block rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                            {exam.code}
                          </span>
                        </CardDescription>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleViewDetails(exam)}>
                        <Info className="h-4 w-4" />
                        <span className="sr-only">View Details</span>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center">
                        <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>
                          {exam.date} at {exam.time}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Duration:</span>
                        <span>{exam.duration}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Fee:</span>
                        <span>₹{exam.fee}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Location:</span>
                        <span>{exam.location}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="bg-muted/50 pt-3">
                    <Button className="w-full" onClick={() => handleRegister(exam.id)}>
                      Register
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Registered Exams Tab */}
          <TabsContent value="registered" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {registeredExams.map((exam) => (
                <Card key={exam.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between">
                      <div>
                        <CardTitle>{exam.name}</CardTitle>
                        <CardDescription className="mt-1">
                          <span className="inline-block rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                            {exam.code}
                          </span>
                        </CardDescription>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleViewDetails(exam)}>
                        <Info className="h-4 w-4" />
                        <span className="sr-only">View Details</span>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center">
                        <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>
                          {exam.date} at {exam.time}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Duration:</span>
                        <span>{exam.duration}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Fee:</span>
                        <span>₹{exam.fee}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <span className={`capitalize ${exam.status === "paid" ? "text-green-500" : "text-amber-500"}`}>
                          {exam.status}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Seat Number:</span>
                        <span>{exam.seatNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Exam Center:</span>
                        <span>{exam.examCenter}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Registered on:</span>
                        <span>{new Date(exam.registrationDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="bg-muted/50 pt-3">
                    {exam.status === "unpaid" ? (
                      <Button className="w-full" onClick={() => handlePayFee(exam.id)}>
                        Pay Fee
                      </Button>
                    ) : exam.admitCardAvailable ? (
                      <Button className="w-full" onClick={() => handleDownloadAdmitCard(exam.id)}>
                        <Download className="mr-2 h-4 w-4" />
                        Download Admit Card
                      </Button>
                    ) : (
                      <Button className="w-full" disabled>
                        Admit Card Not Available
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Exam Details Dialog */}
        <Dialog open={isExamDetailsOpen} onOpenChange={setIsExamDetailsOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{selectedExam?.name}</DialogTitle>
              <DialogDescription>
                Exam details and registration information.
              </DialogDescription>
            </DialogHeader>
            {selectedExam && (
              <>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Date</Label>
                    <div className="col-span-3">{selectedExam.date}</div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Time</Label>
                    <div className="col-span-3">{selectedExam.time}</div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Duration</Label>
                    <div className="col-span-3">{selectedExam.duration}</div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Fee</Label>
                    <div className="col-span-3">${selectedExam.fee}</div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    onClick={() => {
                      setIsExamDetailsOpen(false)
                      handleRegisterForExam(selectedExam.id, selectedExam.name)
                    }}
                    disabled={activeTab !== 'available' || registrationInProgress || registeredExams.some(r => r.id === selectedExam.id)}
                  >
                    {registrationInProgress ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Registering...
                      </>
                    ) : (
                      "Register"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsExamDetailsOpen(false)}
                  >
                    Close
                  </Button>
                </DialogFooter>
              </>
            )}
            </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
