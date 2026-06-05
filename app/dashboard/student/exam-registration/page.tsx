"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"

interface Exam {
    id: number
    name: string
    date: string
    time: string
    duration: number
    total_marks: number
    registration_deadline: string
    fee: number
}

export default function ExamRegistrationPage() {
    const [exams, setExams] = useState<Exam[]>([])
    const [loading, setLoading] = useState(true)
    const [registering, setRegistering] = useState<number | null>(null)
    const router = useRouter()
    const { toast } = useToast()

    useEffect(() => {
        fetchAvailableExams()
    }, [])

    const fetchAvailableExams = async () => {
        try {
            const response = await fetch('http://localhost:3001/api/exams')
            if (!response.ok) throw new Error('Failed to fetch exams')
            
            const data = await response.json()
            if (data.success) {
                setExams(data.data)
            }
        } catch (error) {
            console.error('Error fetching exams:', error)
            toast({
                title: "Error",
                description: "Failed to fetch available exams",
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }

    const handleRegister = async (examId: number) => {
        try {
            setRegistering(examId)
            
            // Get student ID from localStorage or session
            const studentId = localStorage.getItem('studentId')
            if (!studentId) {
                throw new Error('Student ID not found')
            }

            const response = await fetch('http://localhost:3001/api/exams/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    student_id: parseInt(studentId),
                    exam_id: examId
                })
            })

            const data = await response.json()
            
            if (data.success) {
                toast({
                    title: "Success",
                    description: "Successfully registered for the exam"
                })
                // Refresh exams list
                fetchAvailableExams()
            } else {
                throw new Error(data.message || 'Registration failed')
            }
        } catch (error) {
            console.error('Error registering for exam:', error)
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to register for exam",
                variant: "destructive"
            })
        } finally {
            setRegistering(null)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        )
    }

    return (
        <div className="container mx-auto py-8">
            <h1 className="text-3xl font-bold mb-8">Available Exams</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {exams.map((exam) => (
                    <Card key={exam.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                            <CardTitle>{exam.name}</CardTitle>
                            <CardDescription>
                                Date: {format(new Date(exam.date), 'PPP')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <p><strong>Time:</strong> {exam.time}</p>
                                <p><strong>Duration:</strong> {exam.duration} minutes</p>
                                <p><strong>Total Marks:</strong> {exam.total_marks}</p>
                                <p><strong>Registration Deadline:</strong> {format(new Date(exam.registration_deadline), 'PPP')}</p>
                                <p><strong>Fee:</strong> ₹{exam.fee}</p>
                            </div>
                            
                            <Button 
                                className="w-full mt-4"
                                onClick={() => handleRegister(exam.id)}
                                disabled={registering === exam.id}
                            >
                                {registering === exam.id ? "Registering..." : "Register"}
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
} 