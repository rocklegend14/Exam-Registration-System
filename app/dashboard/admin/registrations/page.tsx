"use client"

import { useState, useEffect } from 'react';
import Link from "next/link"
import { useRouter } from "next/navigation"
import { BookOpen, CreditCard, Download, FileText, Filter, Home, LogOut, RefreshCw, Search, Settings, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Sidebar } from "@/components/Sidebar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Registration {
  id: number;
  student_id: number;
  student_name: string;
  roll_number: string;
  department: string;
  exam_id: number;
  exam_title: string;
  date: string;
  time: string;
  duration: number;
  fee: number;
  payment_status: 'paid' | 'unpaid';
  registration_date: string;
  seat_number?: string;
  exam_center?: string;
  exam_room?: string;
}

export default function AdminRegistrationsPage() {
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [filteredRegistrations, setFilteredRegistrations] = useState<Registration[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [examFilter, setExamFilter] = useState("all")
  const [paymentFilter, setPaymentFilter] = useState("all")
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null)
  const [isAllocating, setIsAllocating] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [exams, setExams] = useState<{id: number, name: string}[]>([])
  const [seatNumber, setSeatNumber] = useState("")
  const [examCenter, setExamCenter] = useState("")
  const [examRoom, setExamRoom] = useState("")
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  
  const { toast } = useToast()
  const router = useRouter()

  // Fetch registrations and exams on component mount
  useEffect(() => {
    fetchRegistrations()
    fetchExams()
  }, [refreshTrigger])

  // Fetch all registrations from the backend
  const fetchRegistrations = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("http://localhost:3001/api/exams/registrations", {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch registrations: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log("Registrations data:", data)
      
      if (data && Array.isArray(data)) {
        // Direct array response
        setRegistrations(data)
        setFilteredRegistrations(data)
      } else if (data.success && Array.isArray(data.data)) {
        // Success wrapper response
        setRegistrations(data.data)
        setFilteredRegistrations(data.data)
      } else {
        console.error("Invalid data format:", data)
        toast({
          title: 'Error',
          description: 'Received invalid data format from server',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error("Error fetching registrations:", error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to fetch registrations',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch all exams for the filter dropdown
  const fetchExams = async () => {
    try {
      const response = await fetch("http://localhost:3001/api/exams", {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (!response.ok) {
        throw new Error("Failed to fetch exams")
      }
      
      const data = await response.json()
      
      if (data.success && Array.isArray(data.data)) {
        setExams(data.data.map((exam: any) => ({
          id: exam.id,
          name: exam.name
        })))
      }
    } catch (error) {
      console.error("Error fetching exams:", error)
    }
  }

  // Filter registrations based on search term and filters
  useEffect(() => {
    let filtered = [...registrations]

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(reg =>
        (reg.student_name?.toLowerCase().includes(searchLower)) ||
        (reg.roll_number?.toLowerCase().includes(searchLower)) ||
        (reg.exam_title?.toLowerCase().includes(searchLower))
      )
    }

    if (examFilter !== "all") {
      filtered = filtered.filter(reg => reg.exam_id.toString() === examFilter)
    }

    if (paymentFilter !== "all") {
      filtered = filtered.filter(reg => reg.payment_status === paymentFilter)
    }

    setFilteredRegistrations(filtered)
  }, [searchTerm, examFilter, paymentFilter, registrations])

  // Handle seat allocation dialog
  const handleAllocateSeat = (registration: Registration) => {
    setSelectedRegistration(registration)
    setSeatNumber(registration.seat_number || "")
    setExamCenter(registration.exam_center || "")
    setExamRoom(registration.exam_room || "")
    setIsAllocating(true)
  }

  // Save seat allocation to backend
  const handleSaveAllocation = async () => {
    if (!selectedRegistration) return

    try {
      // Prepare the data for the API
      const allocationData = {
        registration_id: selectedRegistration.id,
        student_id: selectedRegistration.student_id,
        exam_id: selectedRegistration.exam_id,
        seat_number: seatNumber,
        exam_center: examCenter,
        exam_room: examRoom
      }

      console.log("Sending allocation data:", allocationData)

      // Call the API to save the allocation
      const response = await fetch(`http://localhost:3001/api/exams/allocate-seat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(allocationData),
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to allocate seat")
      }

      toast({
        title: 'Success',
        description: 'Seat allocated successfully',
      })
      
      // Refresh the registrations list
      setRefreshTrigger(prev => prev + 1)
    } catch (error) {
      console.error("Error allocating seat:", error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to allocate seat',
        variant: 'destructive',
      })
    } finally {
      setIsAllocating(false)
      setSelectedRegistration(null)
    }
  }

  // Auto-allocate seats for all paid registrations
  const handleAutoAllocate = async () => {
    try {
      // Check if there are any paid registrations without seats
      const paidRegistrations = registrations.filter(reg => reg.payment_status === 'paid' && !reg.seat_number)
      
      if (paidRegistrations.length === 0) {
        toast({
          title: 'Info',
          description: 'No paid registrations without seats found',
        })
        return
      }
      
      toast({
        title: 'Processing',
        description: `Auto-allocating seats for ${paidRegistrations.length} registrations...`,
      })

      // Get the JWT token from localStorage
      const token = localStorage.getItem('token')
      
      if (!token) {
        toast({
          title: 'Authentication Error',
          description: 'You must be logged in to perform this action',
          variant: 'destructive',
        })
        return
      }
      
      // Call the API to auto-allocate seats
      // Note: The backend logic handles finding registrations that need allocation,
      // so we don't need to send specific registration IDs
      const response = await fetch(`http://localhost:3001/api/exams/auto-allocate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        // Empty body - backend will query database for registrations needing allocation
        body: JSON.stringify({})
      })
      
      if (!response.ok) {
        let errorMessage = 'Failed to auto-allocate seats'
        
        try {
          const errorData = await response.json()
          console.error("Server error details:", errorData)
          errorMessage = errorData.message || errorData.error || errorMessage
        } catch (e) {
          console.error("Response is not JSON format:", response.statusText)
          errorMessage = `${response.status}: ${response.statusText || errorMessage}`
        }
        
        throw new Error(errorMessage)
      }
      
      const data = await response.json()
      
      toast({
        title: 'Success',
        description: `Successfully allocated ${data.allocatedCount || 'all'} seats`,
      })
      
      // Refresh the registrations list
      setRefreshTrigger(prev => prev + 1)
    } catch (error) {
      console.error("Error auto-allocating seats:", error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to auto-allocate seats',
        variant: 'destructive',
      })
    }
  }

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  const handleLogout = () => {
    router.push("/")
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-6 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Student Registrations</h1>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button variant="outline" onClick={handleAutoAllocate}>
              Auto-Allocate Seats
            </Button>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Registration Statistics</CardTitle>
            <CardDescription>Overview of student registrations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-600">Total Registrations</p>
                <p className="text-2xl font-bold">{registrations.length}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-600">Paid Registrations</p>
                <p className="text-2xl font-bold">
                  {registrations.filter(r => r.payment_status === 'paid').length}
                </p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm text-yellow-600">Pending Payments</p>
                <p className="text-2xl font-bold">
                  {registrations.filter(r => r.payment_status === 'unpaid').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search student or exam..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-col md:flex-row gap-2">
            <Select value={examFilter} onValueChange={setExamFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by Exam" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Exams</SelectItem>
                {exams.map(exam => (
                  <SelectItem key={exam.id} value={exam.id.toString()}>{exam.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Payment Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            <p className="ml-2 text-gray-500">Loading registrations...</p>
          </div>
        ) : filteredRegistrations.length === 0 ? (
          <div className="text-center p-8 bg-white rounded-lg border">
            <p className="text-gray-500">No registrations found.</p>
            {searchTerm || examFilter !== "all" || paymentFilter !== "all" ? (
              <p className="text-sm text-gray-400 mt-1">Try adjusting your filters.</p>
            ) : null}
          </div>
        ) : (
          <div className="border rounded-lg bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Roll Number</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Exam</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Seat Details</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRegistrations.map((registration) => (
                    <TableRow key={registration.id}>
                      <TableCell className="font-medium">{registration.student_name}</TableCell>
                      <TableCell>{registration.roll_number}</TableCell>
                      <TableCell>{registration.department}</TableCell>
                      <TableCell>{registration.exam_title}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{new Date(registration.date).toLocaleDateString()}</span>
                          <span className="text-xs text-gray-500">{registration.time}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={registration.payment_status === 'paid' ? 'bg-green-100 text-green-800 hover:bg-green-100' : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'}>
                          {registration.payment_status === 'paid' ? 'Paid' : 'Unpaid'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {registration.seat_number ? (
                          <div className="flex flex-col">
                            <span className="font-medium">Seat: {registration.seat_number}</span>
                            <span className="text-xs text-gray-500">
                              {registration.exam_center} {registration.exam_room ? `- ${registration.exam_room}` : ''}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400">Not allocated</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAllocateSeat(registration)}
                          disabled={registration.payment_status !== 'paid'}
                        >
                          {registration.seat_number ? 'Edit Allocation' : 'Allocate Seat'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        <Dialog open={isAllocating} onOpenChange={(open) => {
          setIsAllocating(open)
          if (!open) setSelectedRegistration(null)
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedRegistration?.seat_number ? 'Edit Seat Allocation' : 'Allocate Seat'}
              </DialogTitle>
              <DialogDescription>
                {selectedRegistration && (
                  <div className="mt-2">
                    <p><strong>Student:</strong> {selectedRegistration.student_name}</p>
                    <p><strong>Exam:</strong> {selectedRegistration.exam_title}</p>
                  </div>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="seatNumber">Seat Number</Label>
                <Input 
                  id="seatNumber" 
                  placeholder="e.g., A101" 
                  value={seatNumber}
                  onChange={(e) => setSeatNumber(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="examCenter">Exam Center</Label>
                <Input 
                  id="examCenter" 
                  placeholder="e.g., Main Building" 
                  value={examCenter}
                  onChange={(e) => setExamCenter(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="examRoom">Room Number</Label>
                <Input 
                  id="examRoom" 
                  placeholder="e.g., Room 101" 
                  value={examRoom}
                  onChange={(e) => setExamRoom(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsAllocating(false)
                  setSelectedRegistration(null)
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveAllocation} disabled={!seatNumber || !examCenter}>
                Save Allocation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
