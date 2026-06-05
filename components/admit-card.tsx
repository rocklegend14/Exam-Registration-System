"use client"

import { useRef } from "react"
import { Download, Printer } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

interface AdmitCardProps {
  studentName: string
  studentId: string
  examName: string
  examDate: string
  examTime: string
  examDuration: string
  seatNumber: string
  examCenter: string
  examRoom: string
  onDownload?: () => void
}

export function AdmitCard({
  studentName = "", 
  studentId,
  examName,
  examDate,
  examTime,
  examDuration,
  seatNumber,
  examCenter,
  examRoom,
  onDownload,
}: AdmitCardProps) {
  const admitCardRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  const handlePrint = () => {
    if (admitCardRef.current) {
      const printWindow = window.open("", "_blank")
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Admit Card - ${studentName}</title>
              <style>
                body {
                  font-family: Arial, sans-serif;
                  padding: 20px;
                }
                .admit-card {
                  border: 1px solid #000;
                  padding: 20px;
                  max-width: 800px;
                  margin: 0 auto;
                }
                .header {
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  border-bottom: 2px solid #000;
                  padding-bottom: 10px;
                  margin-bottom: 20px;
                }
                .logo {
                  font-weight: bold;
                  font-size: 24px;
                }
                .title {
                  font-size: 24px;
                  font-weight: bold;
                  text-align: center;
                  margin: 20px 0;
                }
                .info-grid {
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  gap: 15px;
                }
                .info-item {
                  margin-bottom: 10px;
                }
                .label {
                  font-weight: bold;
                }
                .footer {
                  margin-top: 30px;
                  text-align: center;
                  font-size: 12px;
                }
              </style>
            </head>
            <body>
              <div class="admit-card">
                <div class="header">
                  <div class="logo">Exam Registration System</div>
                  <div>Admit Card</div>
                </div>
                <div class="title">${examName}</div>
                <div class="info-grid">
                  <div class="info-item">
                    <div class="label">Student Name:</div>
                    <div>${studentName}</div>
                  </div>
                  <div class="info-item">
                    <div class="label">Student ID:</div>
                    <div>${studentId}</div>
                  </div>
                  <div class="info-item">
                    <div class="label">Exam Date:</div>
                    <div>${examDate}</div>
                  </div>
                  <div class="info-item">
                    <div class="label">Exam Time:</div>
                    <div>${examTime}</div>
                  </div>
                  <div class="info-item">
                    <div class="label">Duration:</div>
                    <div>${examDuration}</div>
                  </div>
                  <div class="info-item">
                    <div class="label">Seat Number:</div>
                    <div>${seatNumber}</div>
                  </div>
                  <div class="info-item">
                    <div class="label">Exam Center:</div>
                    <div>${examCenter}</div>
                  </div>
                  <div class="info-item">
                    <div class="label">Room:</div>
                    <div>${examRoom}</div>
                  </div>
                </div>
                <div class="footer">
                  <p>This admit card must be presented at the examination center.</p>
                  <p>Please arrive 30 minutes before the exam start time.</p>
                </div>
              </div>
            </body>
          </html>
        `)
        printWindow.document.close()
        printWindow.print()
      }
    }
  }

  const handleDownload = () => {
    if (onDownload) {
      onDownload()
    } else {
      toast({
        title: "Admit Card Downloaded",
        description: "Your admit card has been downloaded successfully.",
      })
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto" ref={admitCardRef}>
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="text-xl font-bold">
              <span className="text-primary">Exam</span>
              <span>Registration</span>
            </div>
          </div>
          <CardTitle>Admit Card</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold">{examName}</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Student Name</h3>
              <p className="text-lg font-medium">{studentName}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Student ID</h3>
              <p className="text-lg font-medium">{studentId}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Exam Date</h3>
              <p className="text-lg font-medium">{examDate}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Exam Time</h3>
              <p className="text-lg font-medium">{examTime}</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Duration</h3>
              <p className="text-lg font-medium">{examDuration}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Seat Number</h3>
              <p className="text-lg font-medium">{seatNumber}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Exam Center</h3>
              <p className="text-lg font-medium">{examCenter}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Room</h3>
              <p className="text-lg font-medium">{examRoom}</p>
            </div>
          </div>
        </div>
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>This admit card must be presented at the examination center.</p>
          <p>Please arrive 30 minutes before the exam start time.</p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end space-x-2 border-t pt-4">
        <Button variant="outline" onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" />
          Print
        </Button>
        <Button onClick={handleDownload}>
          <Download className="mr-2 h-4 w-4" />
          Download PDF
        </Button>
      </CardFooter>
    </Card>
  )
}
