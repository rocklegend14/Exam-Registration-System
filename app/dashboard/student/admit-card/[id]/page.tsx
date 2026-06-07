"use client"

import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { jsPDF } from "jspdf"
import html2canvas from "html2canvas"

import { AdmitCard } from "@/components/admit-card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

export default function AdmitCardPage() {
  const params = useParams()
  const [loading, setLoading] = useState(true)
  const [admitCardData, setAdmitCardData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPaid, setIsPaid] = useState(false)
  const admitCardRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    const fetchAdmitCard = async () => {
      try {
        setLoading(true)
        
        // Get student ID from localStorage
        let studentId = localStorage.getItem('userId')
        // Get stored student name as backup
        let storedStudentName = localStorage.getItem('userName')
        
        if (!studentId) {
          throw new Error('User not authenticated. Please log in again.')
        }
        
        const examId = params.id
        
        // Fetch admit card data from the backend
        const response = await fetch(`https://exam-registration-system-6ncs.onrender.com/api/exams/admit-card/${examId}/${studentId}`)
        const data = await response.json()
        
        if (!response.ok) {
          // If payment is required, set the specific error and show student name if available
          if (response.status === 403 && data.message.includes('Payment is required')) {
            setError('Payment is required to access the admit card')
            setIsPaid(false)
            
            // If the API returns student name even when payment is required, use it
            if (data.studentName) {
              setAdmitCardData({
                studentName: data.studentName,
                examName: data.examName,
                examFee: data.examFee,
                // Include other fields as needed
              })
            } else if (storedStudentName) {
              // Use the name from localStorage if available
              setAdmitCardData({
                studentName: storedStudentName,
                examName: data.examName,
                examFee: data.examFee,
                // Include other fields as needed
              })
            } else {
              setAdmitCardData(null)
            }
          } else {
            setError(data.message || 'Failed to fetch admit card')
            setAdmitCardData(null)
          }
          return
        }
        
        if (data.success && data.data) {
          // Make sure we have a valid student name, fallback to localStorage if needed
          const admitData = {
            ...data.data,
            studentName: data.data.studentName || storedStudentName || "" 
          }
          setAdmitCardData(admitData)
          setIsPaid(true)
          setError(null)
        } else {
          setError(data.message || 'Failed to fetch admit card data')
          setAdmitCardData(null)
        }
      } catch (error) {
        console.error("Error fetching admit card:", error)
        setError(error instanceof Error ? error.message : 'An unexpected error occurred')
        setAdmitCardData(null)
      } finally {
        setLoading(false)
      }
    }

    fetchAdmitCard()
  }, [params.id, toast])

  const generatePDF = async () => {
    if (!admitCardRef.current || !isPaid) return
    
    toast({
      title: "Generating PDF",
      description: "Please wait while we generate your admit card...",
    })

    try {
      const canvas = await html2canvas(admitCardRef.current, {
        scale: 2,
        logging: false,
        useCORS: true,
      })

      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      })

      const imgWidth = 210
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight)
      pdf.save(`admit_card_${params.id}.pdf`)

      toast({
        title: "PDF Generated",
        description: "Your admit card has been downloaded successfully.",
      })
    } catch (error) {
      console.error("Error generating PDF:", error)
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading admit card...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <p className="text-lg font-medium text-red-500 mb-4">{error}</p>
          {!isPaid && admitCardData && (
            <div className="mb-6">
              <p className="mb-2">Please complete the payment to access your admit card for:</p>
              <p className="font-medium">{admitCardData.examName}</p>
              {admitCardData.studentName && (
                <p className="mt-2">Student: {admitCardData.studentName}</p>
              )}
              {admitCardData.examFee && (
                <p className="mt-2">Fee: ₹{admitCardData.examFee}</p>
              )}
              <Button 
                className="mt-4" 
                onClick={() => router.push(`/dashboard/student?tab=registered`)}
              >
                Go to Payment
              </Button>
            </div>
          )}
          <Button asChild variant="outline" className="mt-4">
            <Link href="/dashboard/student">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  if (!admitCardData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium">Admit card not found</p>
          <Button asChild className="mt-4">
            <Link href="/dashboard/student">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Button variant="outline" asChild>
          <Link href="/dashboard/student">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
      <div ref={admitCardRef}>
        <AdmitCard 
          {...admitCardData} 
          onDownload={generatePDF} 
          studentName={admitCardData.studentName} 
        />
      </div>
    </div>
  )
}
