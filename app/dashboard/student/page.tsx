"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { BookOpen, Calendar, CreditCard, Download, FileText, Filter, Home, LogOut, Search, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

export default function StudentDashboard() {
  const [searchTerm, setSearchTerm] = useState("")
  const [subjectFilter, setSubjectFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false)
  const [selectedExam, setSelectedExam] = useState<any>(null)
  const [selectedExamId, setSelectedExamId] = useState<number | null>(null)
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState("card")
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success" | "failed">("idle")
  const [formData, setFormData] = useState({
    name: typeof window !== "undefined" ? localStorage.getItem('userName') || "" : "",
    email: typeof window !== "undefined" ? localStorage.getItem('userEmail') || "" : "",
    cardNumber: "",
    cardExpiry: "",
    cardCvv: "",
    upiId: "",
  })
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false)
  const [receiptData, setReceiptData] = useState<any>(null)
  const [availableExams, setAvailableExams] = useState<any[]>([])
  const [registeredExams, setRegisteredExams] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const { toast } = useToast()
  const router = useRouter()

  // Fetch available exams and registered exams on component mount
  useEffect(() => {
    fetchExams();
    fetchRegisteredExams();
  }, []);

  // Fetch available exams from the backend
  const fetchExams = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/exams');
      if (!response.ok) {
        throw new Error('Failed to fetch exams');
      }
      const data = await response.json();
      console.log('Exams data received:', data); // Debug log
      
      if (data.success) {
        if (!data.data || data.data.length === 0) {
          console.log('No exams found in database');
          setAvailableExams([]);
          return;
        }
        
        // Map the data to match the expected format and update dates to 2026
        const formattedExams = data.data.map((exam: any) => {
          // Convert date to Date object, update year to 2026, then format as needed
          let examDate = new Date(exam.date);
          examDate.setFullYear(2026);
          
          return {
            id: exam.id,
            name: exam.name || 'Untitled Exam', // Using name instead of title
            date: examDate.toLocaleDateString(),
            time: exam.time || '9:00 AM',
            duration: `${exam.duration || 3} hours`,
            fee: parseFloat(exam.fee) || 50,
            status: 'open',
          };
        });
        
        console.log('Formatted exams:', formattedExams);
        setAvailableExams(formattedExams);
      } else {
        console.warn('API returned success: false', data.message);
        setAvailableExams([]);
      }
    } catch (error) {
      console.error('Error fetching exams:', error);
      toast({
        title: "Error",
        description: "Failed to fetch available exams",
        variant: "destructive"
      });
      setAvailableExams([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch registered exams from the backend
  const fetchRegisteredExams = async () => {
    try {
      let studentId = localStorage.getItem('userId');
      console.log('Student ID for registration fetch:', studentId);
      
      if (!studentId) {
        // For testing, use a hardcoded student ID if none is found
        console.log('No student ID found for fetch. Using test ID 1');
        studentId = '1';
        localStorage.setItem('userId', studentId);
      }

      // Debugging output
      console.log('Fetching registrations for student ID:', studentId);

      // Changed to use regular registrations endpoint and filter on the frontend
      const response = await fetch(`http://localhost:3001/api/exams/registrations`);
      
      // Check if response is ok
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API response error:', response.status, errorText);
        throw new Error(`Failed to fetch registered exams: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Registration data received:', data);
      
      if (data.success) {
        // Filter registrations for this student only
        const studentRegistrations = data.data.filter((reg: any) => 
          reg.student_id && reg.student_id.toString() === studentId);
          
        console.log('Filtered registrations for student:', studentRegistrations);
        
        // If we have registrations, we need to get the full exam details for each one
        if (studentRegistrations.length > 0) {
          // Get all exams
          const examsResponse = await fetch('http://localhost:3001/api/exams');
          let exams: any[] = [];
          
          if (examsResponse.ok) {
            const examsData = await examsResponse.json();
            if (examsData.success) {
              exams = examsData.data;
            }
          }
          
          // Map the data to match the expected format
          const formattedRegistrations = studentRegistrations.map((reg: any) => {
            // Find the matching exam details
            const examDetails = exams.find(e => e.id === reg.exam_id) || {};
            
            // Convert date to Date object, update year to 2026, then format as needed
            let examDate = new Date(examDetails.date || Date.now());
            examDate.setFullYear(2026);
            
            return {
              id: reg.exam_id,
              name: examDetails.name || 'Untitled Exam',
              date: examDate.toLocaleDateString(),
              time: examDetails.time || '9:00 AM',
              duration: `${examDetails.duration || 3} hours`,
              fee: parseFloat(examDetails.fee) || 50,
              status: reg.payment_status || 'unpaid', // Use the payment_status from the backend
              seatNumber: reg.seat_number || 'Pending',
              examCenter: reg.exam_center || 'Pending',
              admitCardAvailable: reg.admit_card_available || false,
              registrationId: reg.id, // Store the registration ID for payment processing
            };
          });
          
          console.log('Formatted registrations:', formattedRegistrations);
          setRegisteredExams(formattedRegistrations);
        } else {
          setRegisteredExams([]);
        }
      } else {
        // Handle case where API returns success: false
        console.warn('API returned success: false', data.message);
        setRegisteredExams([]);
      }
    } catch (error) {
      console.error('Error fetching registered exams:', error);
      toast({
        title: "Error",
        description: "Failed to fetch registered exams. Please try again later.",
        variant: "destructive"
      });
      // Continue with empty registrations
      setRegisteredExams([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter available exams based on search term and filters
  const filteredAvailableExams = availableExams.filter((exam) => {
    // Add null checks to prevent toLowerCase() on undefined/null values
    const examName = exam.name || '';
    const matchesSearch = examName.toLowerCase().includes((searchTerm || '').toLowerCase());
    
    // More flexible subject matching
    const matchesSubject = 
      subjectFilter === "all" || 
      examName.toLowerCase().includes((subjectFilter || '').toLowerCase());
    
    // Improved date matching
    const matchesDate = 
      dateFilter === "all" || 
      (exam.date && exam.date.includes(dateFilter));
      
    return matchesSearch && matchesSubject && matchesDate;
  });

  // Extract unique subjects from available exams for dynamic filter options
  const uniqueSubjects = [...new Set(
    availableExams
      .map(exam => {
        const name = exam.name?.toLowerCase() || '';
        if (name.includes('math')) return 'mathematics';
        if (name.includes('physics')) return 'physics';
        if (name.includes('computer') || name.includes('programming') || name.includes('software')) return 'computer science';
        if (name.includes('english') || name.includes('language')) return 'english';
        if (name.includes('chemistry')) return 'chemistry';
        if (name.includes('biology')) return 'biology';
        return null;
      })
      .filter(Boolean) // Remove null values
  )];

  // Extract unique dates from available exams for the date filter
  const uniqueDates = [...new Set(
    availableExams
      .map(exam => exam.date)
      .filter(Boolean) // Remove undefined/null values
  )];

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Update the handleRegister function to show registration dialog
  const handleRegister = (examId: number) => {
    const exam = availableExams.find((e) => e.id === examId)
    if (!exam) return

    setSelectedExam(exam)
    setIsRegisterDialogOpen(true)
  }

  // Confirm registration and proceed to payment
  const confirmRegistration = async () => {
    if (!selectedExam) return;
    
    try {
      // Get student ID from localStorage
      let studentId = localStorage.getItem('userId');
      console.log('Student ID from localStorage:', studentId);
      
      if (!studentId) {
        // For testing, use a hardcoded student ID if none is found
        console.log('No student ID found. Using test ID 1');
        studentId = '1';
        localStorage.setItem('userId', studentId);
        
        toast({
          title: "Warning",
          description: "Using test student ID. In production, please log in properly.",
          variant: "destructive"
        });
      }
      
      // First, check if student is already registered for this exam
      const checkResponse = await fetch(`http://localhost:3001/api/exams/registrations`);
      if (!checkResponse.ok) {
        throw new Error('Failed to check existing registrations');
      }
      
      const registrationsData = await checkResponse.json();
      const existingRegistration = registrationsData.data.find(
        (reg: any) => reg.student_id.toString() === studentId && reg.exam_id === selectedExam.id
      );
      
      if (existingRegistration) {
        setIsRegisterDialogOpen(false);
        toast({
          title: "Already Registered",
          description: "You are already registered for this exam. Please proceed to payment if needed.",
        });
        
        // Refresh to ensure we have latest registrations data
        await fetchRegisteredExams();
        
        // Check if already paid
        if (existingRegistration.payment_status === 'paid') {
          toast({
            title: "Payment Complete",
            description: "You have already paid for this exam.",
          });
        } else {
          // If not paid, open payment dialog
          setIsPaymentDialogOpen(true);
        }
        return;
      }
      
      // Not registered yet, proceed with registration
      setIsRegisterDialogOpen(false);
      
      // Debug: Log the selected exam
      console.log('Selected exam for registration:', selectedExam);
      
      // Call API to register for exam
      const response = await fetch('http://localhost:3001/api/exams/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_id: parseInt(studentId),
          exam_id: selectedExam.id
        })
      });
      
      const data = await response.json();
      console.log('Registration response:', data);
      
      if (data.success) {
        // Get the registration ID from the response
        const registrationId = data.data?.id || null;
        
        // Update the selected exam with the registration ID
        setSelectedExam({
          ...selectedExam,
          registrationId: registrationId
        });
        
        toast({
          title: "Exam Registration",
          description: "You have successfully registered for the exam. Please proceed to payment.",
        });
        
        // Refresh the registrations list
        await fetchRegisteredExams();
        
        // Important: Use setTimeout to ensure state update happens before opening dialog
        setTimeout(() => {
          setIsPaymentDialogOpen(true);
        }, 500);
      } else {
        throw new Error(data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Error registering for exam:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to register for exam",
        variant: "destructive"
      });
    }
  }

  // Process payment
  const processPayment = async () => {
    // First check if we have a selected exam, if not, try to get it from the ID
    let examToProcess = selectedExam;
    
    if (!examToProcess || Object.keys(examToProcess).length === 0) {
      if (selectedExamId) {
        console.log('Selected exam is empty, trying to find it using ID:', selectedExamId);
        const exam = registeredExams.find(e => e.id === selectedExamId);
        if (exam) {
          examToProcess = {
            ...exam
          };
          console.log('Found exam using ID:', examToProcess);
        }
      }
    }
    
    if (!examToProcess || Object.keys(examToProcess).length === 0) {
      toast({
        title: "Error",
        description: "No exam selected for payment. Please try again.",
        variant: "destructive",
      });
      return;
    }

    console.log('Processing payment for exam:', examToProcess);

    // Validate form based on payment method
    if (paymentMethod === "card") {
      if (!formData.cardNumber || !formData.cardExpiry || !formData.cardCvv) {
        toast({
          title: "Validation Error",
          description: "Please fill in all card details",
          variant: "destructive",
        });
        return;
      }
    } else if (paymentMethod === "upi") {
      if (!formData.upiId) {
        toast({
          title: "Validation Error",
          description: "Please enter your UPI ID",
          variant: "destructive",
        });
        return;
      }
    }

    // Set payment status to processing
    setPaymentStatus("processing");

    try {
      // Get student ID from localStorage
      let studentId = localStorage.getItem('userId');
      if (!studentId) {
        throw new Error('User not authenticated. Please log in again.');
      }

      // Prepare payment data - using student_id and exam_id directly
      const paymentData = {
        student_id: parseInt(studentId),
        exam_id: examToProcess.id || examToProcess.exam_id,
        amount: examToProcess.fee,
        payment_method: paymentMethod,
        card_details: paymentMethod === 'card' ? {
          cardNumber: formData.cardNumber,
          cardExpiry: formData.cardExpiry,
          cardCvv: formData.cardCvv,
          cardName: formData.name
        } : undefined
      };
      
      console.log('Sending payment data:', JSON.stringify(paymentData));
      
      // Call payment API
      const response = await fetch('http://localhost:3001/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Payment API error:', response.status, errorText);
        throw new Error(`Payment failed: ${response.status} ${response.statusText}. ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Payment response:', data);
      
      if (data.success) {
        setPaymentStatus("success");
        
        // Prepare receipt data
        const receipt = {
          transactionId: data.data.transaction_id,
          date: data.data.payment_date,
          examName: examToProcess.name || examToProcess.exam_title,
          examDate: examToProcess.date,
          amount: examToProcess.fee,
          paymentMethod: paymentMethod === "card" ? "Credit/Debit Card" : "UPI",
          studentName: formData.name || 'Student',
          studentEmail: formData.email || 'student@example.com',
          examId: examToProcess.id || examToProcess.exam_id
        };
        
        setReceiptData(receipt);
        
        // Refresh registered exams to get updated list
        await fetchRegisteredExams();
        
        // Show success message
        toast({
          title: "Payment Successful",
          description: "Your payment has been processed successfully.",
        });
        
        // Close payment dialog and open receipt after a delay
        setTimeout(() => {
          setIsPaymentDialogOpen(false);
          setPaymentStatus("idle");
          setIsReceiptDialogOpen(true);
        }, 1500);
      } else {
        throw new Error(data.message || 'Payment failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      setPaymentStatus("failed");
      
      // Show failure message
      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : "There was an issue processing your payment. Please try again.",
        variant: "destructive",
      });
      
      // Reset payment status after a delay
      setTimeout(() => {
        setPaymentStatus("idle");
      }, 2000);
    }
  };

  // Download receipt as PDF
  const downloadReceipt = () => {
    if (!receiptData) return

    // Create receipt content
    const receiptContent = `
    EXAM REGISTRATION RECEIPT
    -------------------------
    Transaction ID: ${receiptData.transactionId}
    Date: ${new Date(receiptData.date).toLocaleString()}
    
    STUDENT INFORMATION
    ------------------
    Name: ${receiptData.studentName}
    Email: ${receiptData.studentEmail}
    
    EXAM DETAILS
    ------------
    Exam: ${receiptData.examName}
    Exam Date: ${receiptData.examDate}
    
    PAYMENT DETAILS
    --------------
    Amount: ₹${receiptData.amount}
    Payment Method: ${receiptData.paymentMethod}
    Status: Paid
    
    This is a computer-generated receipt and does not require a signature.
    Thank you for your payment!
    `

    const blob = new Blob([receiptContent], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `receipt_${receiptData.transactionId}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Receipt Downloaded",
      description: "Your receipt has been downloaded successfully.",
    })

    // Close receipt dialog
    setIsReceiptDialogOpen(false)
  }

  // Function to automatically generate and download admit card after payment
  const generateAdmitCardAfterPayment = () => {
    if (!receiptData || !receiptData.examId) return;
    
    // Close receipt dialog
    setIsReceiptDialogOpen(false);
    
    // Show loading toast
    toast({
      title: "Generating Admit Card",
      description: "Please wait while we generate your admit card...",
    });
    
    // Navigate to admit card page
    router.push(`/dashboard/student/admit-card/${receiptData.examId}`);
  }

  // Handle direct payment for already registered exams
  const handlePayFee = (examId: number) => {
    const exam = registeredExams.find((e) => e.id === examId);
    if (!exam) {
      console.error('Exam not found in registeredExams:', examId);
      toast({
        title: "Error",
        description: "Could not find exam details. Please refresh the page and try again.",
        variant: "destructive",
      });
      return;
    }

    console.log('Selected exam for payment:', exam);
    
    // Create a complete exam object with all necessary properties
    const examWithRegistration = {
      ...exam,
      registrationId: exam.registration_id || exam.id,
    };
    
    console.log('Setting selected exam with registration:', examWithRegistration);
    
    // Set the selected exam with all necessary data
    setSelectedExam(examWithRegistration);
    setSelectedExamId(examId);
    setIsPaymentDialogOpen(true);
  }

  // Download admit card
  const handleDownloadAdmitCard = (examId: number) => {
    router.push(`/dashboard/student/admit-card/${examId}`)
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
          <h1 className="text-2xl font-bold">Student Dashboard</h1>
          <div className="mt-4 flex items-center space-x-2 md:mt-0">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Welcome, {formData.name}</span>
              <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                {formData.name ? formData.name.split(' ').map(n => n[0]).join('').toUpperCase() : ''}
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
                  placeholder="Search exams..."
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
                  {uniqueSubjects.map(subject => (
                    <SelectItem key={subject} value={subject}>{subject.charAt(0).toUpperCase() + subject.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Dates</SelectItem>
                  {uniqueDates.map(date => (
                    <SelectItem key={date} value={date}>{date}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                <p className="ml-4">Loading available exams...</p>
              </div>
            ) : availableExams.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <p className="text-center text-lg text-muted-foreground">No exams available at the moment.</p>
                <p className="text-center text-sm text-muted-foreground">Please check back later for upcoming exams.</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredAvailableExams.map((exam) => (
                  <Card key={exam.id}>
                    <CardHeader>
                      <CardTitle>{exam.name}</CardTitle>
                      <CardDescription>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {exam.date} at {exam.time}
                          </span>
                        </div>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
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
                          <span className="capitalize">{exam.status}</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button className="w-full" onClick={() => handleRegister(exam.id)}>
                        Register
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Registered Exams Tab */}
          <TabsContent value="registered" className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                <p className="ml-4">Loading registered exams...</p>
              </div>
            ) : registeredExams.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <p className="text-center text-lg text-muted-foreground">You haven't registered for any exams yet.</p>
                <p className="text-center text-sm text-muted-foreground">Switch to the Available Exams tab to register.</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {registeredExams.map((exam) => (
                  <Card key={exam.id}>
                    <CardHeader>
                      <CardTitle>{exam.name}</CardTitle>
                      <CardDescription>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {exam.date} at {exam.time}
                          </span>
                        </div>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
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
                      </div>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-2">
                      {exam.status !== "paid" ? (
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
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Registration Confirmation Dialog */}
      <Dialog open={isRegisterDialogOpen} onOpenChange={setIsRegisterDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Confirm Exam Registration</DialogTitle>
            <DialogDescription>Please review the exam details before confirming your registration.</DialogDescription>
          </DialogHeader>

          {selectedExam && (
            <div className="space-y-4">
              <div className="rounded-md bg-muted p-4">
                <h4 className="mb-2 font-medium">{selectedExam.name}</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date & Time:</span>
                    <span>
                      {selectedExam.date} at {selectedExam.time}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duration:</span>
                    <span>{selectedExam.duration}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fee:</span>
                    <span>₹{selectedExam.fee}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  By confirming, you agree to register for this exam. After registration, you will need to pay the exam
                  fee to complete the process.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRegisterDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmRegistration}>Confirm & Proceed to Payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog
        open={isPaymentDialogOpen}
        onOpenChange={(open) => {
          if (paymentStatus !== "processing") {
            setIsPaymentDialogOpen(open)
          }
        }}
      >
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Payment</DialogTitle>
            <DialogDescription>Complete your payment for {selectedExam?.name}</DialogDescription>
          </DialogHeader>

          {paymentStatus === "processing" ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              <p className="mt-4 text-center">Processing your payment...</p>
              <p className="text-center text-sm text-muted-foreground">Please do not close this window.</p>
            </div>
          ) : paymentStatus === "success" ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="mt-4 text-center font-medium">Payment Successful!</p>
              <p className="text-center text-sm text-muted-foreground">Your payment has been processed successfully.</p>
            </div>
          ) : paymentStatus === "failed" ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="mt-4 text-center font-medium">Payment Failed</p>
              <p className="text-center text-sm text-muted-foreground">
                There was an issue processing your payment. Please try again.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Student Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Student Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" name="name" value={formData.name} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} />
                  </div>
                </div>
              </div>

              {/* Payment Details */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Payment Details</h3>
                <div className="rounded-md bg-muted p-3">
                  <div className="flex justify-between">
                    <span>Exam Fee:</span>
                    <span className="font-medium">₹{selectedExam?.fee}</span>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Payment Method</h3>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="grid grid-cols-2 gap-4">
                  <div>
                    <RadioGroupItem value="card" id="card" className="peer sr-only" />
                    <Label
                      htmlFor="card"
                      className="flex cursor-pointer flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                    >
                      <CreditCard className="mb-3 h-6 w-6" />
                      Card
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="upi" id="upi" className="peer sr-only" />
                    <Label
                      htmlFor="upi"
                      className="flex cursor-pointer flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="mb-3 h-6 w-6"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect x="2" y="4" width="20" height="16" rx="2" />
                        <path d="M12 12h.01" />
                        <path d="M17 12h.01" />
                        <path d="M7 12h.01" />
                      </svg>
                      UPI
                    </Label>
                  </div>
                </RadioGroup>

                {/* Card Payment Form */}
                {paymentMethod === "card" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="cardNumber">Card Number</Label>
                      <Input
                        id="cardNumber"
                        name="cardNumber"
                        placeholder="1234 5678 9012 3456"
                        value={formData.cardNumber}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="cardExpiry">Expiry Date</Label>
                        <Input
                          id="cardExpiry"
                          name="cardExpiry"
                          placeholder="MM/YY"
                          value={formData.cardExpiry}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cardCvv">CVV</Label>
                        <Input
                          id="cardCvv"
                          name="cardCvv"
                          placeholder="123"
                          value={formData.cardCvv}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* UPI Payment Form */}
                {paymentMethod === "upi" && (
                  <div className="space-y-2">
                    <Label htmlFor="upiId">UPI ID</Label>
                    <Input
                      id="upiId"
                      name="upiId"
                      placeholder="yourname@upi"
                      value={formData.upiId}
                      onChange={handleInputChange}
                    />
                    <p className="text-xs text-muted-foreground">Enter your UPI ID in the format username@bankname</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            {paymentStatus === "idle" && (
              <>
                <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={processPayment}>Pay ₹{selectedExam?.fee}</Button>
              </>
            )}
            {paymentStatus === "processing" && <Button disabled>Processing...</Button>}
            {paymentStatus === "success" && (
              <Button
                onClick={() => {
                  setIsPaymentDialogOpen(false)
                  setPaymentStatus("idle")
                  setIsReceiptDialogOpen(true)
                }}
              >
                View Receipt
              </Button>
            )}
            {paymentStatus === "failed" && (
              <>
                <Button variant="outline" onClick={() => setPaymentStatus("idle")}>
                  Try Again
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setIsPaymentDialogOpen(false)
                    setPaymentStatus("idle")
                  }}
                >
                  Cancel
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={isReceiptDialogOpen} onOpenChange={setIsReceiptDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Payment Receipt</DialogTitle>
            <DialogDescription>Your payment has been processed successfully.</DialogDescription>
          </DialogHeader>

          {receiptData && (
            <div className="space-y-4">
              <div className="rounded-md border p-4">
                <div className="mb-4 text-center">
                  <h3 className="text-lg font-bold">Exam Registration Receipt</h3>
                  <p className="text-sm text-muted-foreground">Transaction ID: {receiptData.transactionId}</p>
                  <p className="text-sm text-muted-foreground">Date: {new Date(receiptData.date).toLocaleString()}</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium">Student Information</h4>
                    <div className="mt-1 space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Name:</span>
                        <span>{receiptData.studentName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Email:</span>
                        <span>{receiptData.studentEmail}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium">Exam Details</h4>
                    <div className="mt-1 space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Exam:</span>
                        <span>{receiptData.examName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Exam Date:</span>
                        <span>{receiptData.examDate}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium">Payment Details</h4>
                    <div className="mt-1 space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Amount:</span>
                        <span className="font-medium">₹{receiptData.amount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Payment Method:</span>
                        <span>{receiptData.paymentMethod}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <span className="text-green-500">Paid</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 text-center text-xs text-muted-foreground">
                  <p>This is a computer-generated receipt and does not require a signature.</p>
                  <p>Thank you for your payment!</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-col space-y-2 sm:flex-row sm:space-x-2 sm:space-y-0">
            <Button variant="outline" onClick={() => setIsReceiptDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={downloadReceipt}>
              <Download className="mr-2 h-4 w-4" />
              Download Receipt
            </Button>
            <Button onClick={generateAdmitCardAfterPayment} className="bg-green-600 hover:bg-green-700">
              <FileText className="mr-2 h-4 w-4" />
              Generate Admit Card
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
