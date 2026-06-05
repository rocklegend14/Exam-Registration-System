"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"

interface RegisteredExam {
    id: number
    exam_id: number
    exam_name: string
    exam_date: string
    registration_date: string
}

export default function MyExamsPage() {
    const [exams, setExams] = useState<RegisteredExam[]>([])
    const [loading, setLoading] = useState(true)
    const { toast } = useToast()

    useEffect(() => {
        fetchMyExams()
    }, [])

    const fetchMyExams = async () => {
        try {
            const studentId = localStorage.getItem('studentId')
            if (!studentId) {
                throw new Error('Student ID not found')
            }

            const response = await fetch(`http://localhost:3001/api/exams/registrations?student_id=${studentId}`)
            if (!response.ok) throw new Error('Failed to fetch registered exams')
            
            const data = await response.json()
            if (data.success) {
                setExams(data.data)
            }
        } catch (error) {
            console.error('Error fetching registered exams:', error)
            toast({
                title: "Error",
                description: "Failed to fetch your registered exams",
                variant: "destructive"
            })
        } finally {
            setLoading(false)
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
            <h1 className="text-3xl font-bold mb-8">My Registered Exams</h1>
            
            {exams.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-lg text-muted-foreground">You haven't registered for any exams yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {exams.map((exam) => (
                        <Card key={exam.id} className="hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <CardTitle>{exam.exam_name}</CardTitle>
                                <CardDescription>
                                    Exam Date: {format(new Date(exam.exam_date), 'PPP')}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    Registered on: {format(new Date(exam.registration_date), 'PPP')}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
} 