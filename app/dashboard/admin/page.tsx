"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  BookOpen,
  Calendar,
  CreditCard,
  Edit,
  Filter,
  Home,
  LogOut,
  Search,
  Settings,
  Trash,
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
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"

interface Exam {
  id: number
  name: string
  date: string
  time: string
  duration: string
  fee: number
  status: string
  registrations_count?: number
  venue?: string
  registration_deadline?: string
}

// Mock data for exam centers
const examCenters = [
  { id: 1, name: "Main Hall", capacity: 100 },
  { id: 2, name: "Science Building", capacity: 80 },
  { id: 3, name: "Computer Lab", capacity: 50 },
  { id: 4, name: "Library", capacity: 40 },
]

export default function AdminDashboard() {
  const [searchTerm, setSearchTerm] = useState("")
  const [examFilter, setExamFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isEditExamOpen, setIsEditExamOpen] = useState(false)
  const [isDeleteExamOpen, setIsDeleteExamOpen] = useState(false)
  const [isAllocateSeatOpen, setIsAllocateSeatOpen] = useState(false)
  const [exams, setExams] = useState<Exam[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null)
  const [selectedRegistration, setSelectedRegistration] = useState<any>(null)
  const [newExam, setNewExam] = useState({
    name: "",
    date: "",
    time: "",
    duration: "",
    fee: "",
    status: "active",
  })
  const [editedExam, setEditedExam] = useState<Exam | null>(null)
  const [seatAllocation, setSeatAllocation] = useState({
    seatNumber: "",
    examCenter: "",
  })
  const { toast } = useToast()
  const router = useRouter()

  // Fetch exams from the API
  useEffect(() => {
    const fetchExams = async () => {
      try {
        setIsLoading(true)
        
        // Get the JWT token from localStorage
        const token = localStorage.getItem('token')
        
        if (!token) {
          toast({
            title: 'Authentication Error',
            description: 'You must be logged in to view the dashboard',
            variant: 'destructive',
          })
          router.push('/login')
          return
        }
        
        const response = await fetch("https://exam-registration-system-6ncs.onrender.com/api/exams", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        })
        
        if (!response.ok) {
          throw new Error(`Failed to fetch exams: ${response.status} ${response.statusText}`)
        }
        
        const data = await response.json()
        
        if (data.success && Array.isArray(data.data)) {
          // Update exam dates from 2023 to 2026
          const updatedExams = data.data.map((exam: Exam) => {
            let date = exam.date
            if (date && date.includes('2023')) {
              date = date.replace('2023', '2026')
            }
            return {
              ...exam,
              date,
              // Format duration if it's a number (minutes)
              duration: typeof exam.duration === 'number' 
                ? `${exam.duration} minutes` 
                : exam.duration
            }
          })
          setExams(updatedExams)
        } else {
          console.error("Invalid exam data format:", data)
          throw new Error('Received invalid data format from server')
        }
      } catch (error) {
        console.error("Error fetching exams:", error)
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to fetch exams',
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchExams()
  }, [toast, router])

  // Filter exams based on search term and filters
  const filteredExams = exams.filter((exam) => {
    const matchesSearch = exam.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || exam.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Format date to local string
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  // Open edit exam dialog
  const handleEditExam = (examId: number) => {
    const exam = exams.find((e) => e.id === examId)
    if (exam) {
      setSelectedExam(exam)
      setEditedExam({
        ...exam,
        fee: exam.fee
      })
      setIsEditExamOpen(true)
    }
  }

  // Save edited exam
  const handleSaveEditedExam = async () => {
    if (!editedExam || !selectedExam) return;

    try {
      // Get the JWT token from localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast({
          title: 'Authentication Error',
          description: 'You must be logged in to perform this action',
          variant: 'destructive',
        });
        return;
      }

      // Make sure fee is a number
      const examToUpdate = {
        ...editedExam,
        fee: typeof editedExam.fee === 'string' ? Number(editedExam.fee) : editedExam.fee
      };

      // Update the exam via API
      const response = await fetch(`https://exam-registration-system-6ncs.onrender.com/api/exams/${examToUpdate.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(examToUpdate)
      });

      if (!response.ok) {
        throw new Error(`Failed to update exam: ${response.status} ${response.statusText}`);
      }

      // Show success message
      toast({
        title: 'Exam Updated',
        description: 'The exam has been updated successfully.',
      });

      // Refresh the exams list to show the updated data
      const updatedExams = exams.map((exam) => 
        exam.id === examToUpdate.id ? examToUpdate : exam
      );
      setExams(updatedExams);

      // Close the dialog
      setIsEditExamOpen(false);
    } catch (error) {
      console.error('Error updating exam:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update exam',
        variant: 'destructive',
      });
    }
  };

  const handleLogout = () => {
    // Clear all authentication data from localStorage
    localStorage.removeItem("token")
    localStorage.removeItem("userId")
    localStorage.removeItem("userRole")
    localStorage.removeItem("userName")
    
    // Redirect to the auth login page
    router.push("/auth/login")
  }

  // Open delete confirmation dialog
  const handleDeleteExam = (examId: number) => {
    const exam = exams.find((e) => e.id === examId);
    if (exam) {
      setSelectedExam(exam);
      setIsDeleteExamOpen(true);
    }
  };

  // Confirm exam deletion
  const handleConfirmDeleteExam = async () => {
    if (!selectedExam) return;

    try {
      // Get the JWT token from localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast({
          title: 'Authentication Error',
          description: 'You must be logged in to perform this action',
          variant: 'destructive',
        });
        return;
      }

      // Delete the exam via API
      const response = await fetch(`https://exam-registration-system-6ncs.onrender.com/api/exams/${selectedExam.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to delete exam: ${response.status} ${response.statusText}`);
      }

      // Show success message
      toast({
        title: 'Exam Deleted',
        description: 'The exam has been deleted successfully.',
      });

      // Remove exam from state
      setExams(exams.filter(exam => exam.id !== selectedExam.id));

      // Close the dialog
      setIsDeleteExamOpen(false);
    } catch (error) {
      console.error('Error deleting exam:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete exam',
        variant: 'destructive',
      });
    }
  };

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
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <div className="mt-4 flex items-center space-x-2 md:mt-0">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Welcome, Admin</span>
              <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                A
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="exams" className="w-full">
          <TabsList className="grid w-full grid-cols-1">
            <TabsTrigger value="exams">Manage Exams</TabsTrigger>
          </TabsList>

          {/* Exams Tab */}
          <TabsContent value="exams" className="space-y-4">
            <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search exams..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              {/* "Add Exam" button removed as requested */}
            </div>

            {isLoading ? (
              <div className="text-center py-10">
                <p>Loading exam data...</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredExams.length === 0 ? (
                  <div className="col-span-full text-center py-10">
                    <p className="text-muted-foreground">No exams found matching your search criteria</p>
                  </div>
                ) : (
                  filteredExams.map((exam) => (
                    <Card key={exam.id}>
                      <CardHeader>
                        <CardTitle>{exam.name}</CardTitle>
                        <CardDescription>
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>
                              {formatDate(exam.date)} at {exam.time}
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
                            <span
                              className={`capitalize ${exam.status === "active" ? "text-green-500" : "text-amber-500"}`}
                            >
                              {exam.status}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Registrations:</span>
                            <span>{exam.registrations_count || 0}</span>
                          </div>
                          {exam.venue && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Venue:</span>
                              <span>{exam.venue}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-between">
                        <Button variant="outline" size="sm" onClick={() => handleEditExam(exam.id)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteExam(exam.id)}>
                          <Trash className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                      </CardFooter>
                    </Card>
                  ))
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Exam Dialog */}
      <Dialog open={isEditExamOpen} onOpenChange={setIsEditExamOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Exam</DialogTitle>
            <DialogDescription>Update the exam details.</DialogDescription>
          </DialogHeader>
          {editedExam && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Exam Name</Label>
                <Input id="edit-name" name="name" value={editedExam.name} onChange={(e) => setEditedExam({ ...editedExam, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-date">Date</Label>
                  <Input id="edit-date" name="date" type="date" value={editedExam.date} onChange={(e) => setEditedExam({ ...editedExam, date: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-time">Time</Label>
                  <Input id="edit-time" name="time" type="time" value={editedExam.time} onChange={(e) => setEditedExam({ ...editedExam, time: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-duration">Duration</Label>
                  <Input id="edit-duration" name="duration" value={editedExam.duration} onChange={(e) => setEditedExam({ ...editedExam, duration: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-fee">Fee (₹)</Label>
                  <Input id="edit-fee" name="fee" type="number" value={editedExam.fee} onChange={(e) => setEditedExam({ ...editedExam, fee: e.target.value })} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select value={editedExam.status} onValueChange={(value) => setEditedExam({ ...editedExam, status: value })}>
                  <SelectTrigger id="edit-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditExamOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEditedExam}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Exam Dialog */}
      <Dialog open={isDeleteExamOpen} onOpenChange={setIsDeleteExamOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Exam</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this exam? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedExam && (
            <div className="py-4">
              <p className="font-medium">{selectedExam.name}</p>
              <p className="text-sm text-muted-foreground">
                Date: {formatDate(selectedExam.date)} at {selectedExam.time}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteExamOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDeleteExam}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Allocate Seat Dialog */}
      <Dialog open={isAllocateSeatOpen} onOpenChange={setIsAllocateSeatOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Allocate Seat</DialogTitle>
            <DialogDescription>Assign a seat number and exam center for this student.</DialogDescription>
          </DialogHeader>
          {selectedRegistration && (
            <div className="py-4">
              <div className="mb-4">
                <p className="font-medium">{selectedRegistration.studentName}</p>
                <p className="text-sm text-muted-foreground">{selectedRegistration.examName}</p>
              </div>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="seatNumber">Seat Number</Label>
                  <Input
                    id="seatNumber"
                    value={seatAllocation.seatNumber}
                    onChange={(e) => setSeatAllocation({ ...seatAllocation, seatNumber: e.target.value })}
                    placeholder="e.g., A123"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="examCenter">Exam Center</Label>
                  <Select
                    value={seatAllocation.examCenter}
                    onValueChange={(value) => setSeatAllocation({ ...seatAllocation, examCenter: value })}
                  >
                    <SelectTrigger id="examCenter">
                      <SelectValue placeholder="Select exam center" />
                    </SelectTrigger>
                    <SelectContent>
                      {examCenters.map((center) => (
                        <SelectItem key={center.id} value={center.name}>
                          {center.name} (Capacity: {center.capacity})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAllocateSeatOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => console.log(seatAllocation)}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
