"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { BookOpen, Calendar, CreditCard, Edit, Home, LogOut, Plus, Search, Settings, Trash, Users } from "lucide-react"

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
import { useToast } from "@/hooks/use-toast"

interface Exam {
  id: number;
  name: string;
  date: string;
  time: string;
  duration: string;
  total_marks: string;
  registration_deadline: string;
  fee: string;
  [key: string]: string | number; // Add this index signature
}

export default function AdminExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [newExam, setNewExam] = useState({
    name: "",
    date: "",
    time: "",
    duration: "",
    total_marks: "",
    registration_deadline: "",
    fee: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  // Fetch exams from API
  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const response = await fetch('https://exam-registration-system-6ncs.onrender.com/api/exams');
      if (!response.ok) {
        throw new Error('Failed to fetch exams');
      }
      const result = await response.json();
      if (result.success) {
        setExams(result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch exams');
      }
    } catch (error) {
      console.error('Error fetching exams:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch exams",
        variant: "destructive",
      });
      setExams([]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewExam(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddExam = async () => {
    // Validate all fields before sending
    const requiredFields = [
      { key: 'name', label: 'Exam Name' },
      { key: 'date', label: 'Date' },
      { key: 'time', label: 'Time' },
      { key: 'duration', label: 'Duration' },
      { key: 'total_marks', label: 'Total Marks' },
      { key: 'registration_deadline', label: 'Registration Deadline' },
      { key: 'fee', label: 'Fee' }
    ];
    for (const field of requiredFields) {
      if (!newExam[field.key as keyof typeof newExam] || newExam[field.key as keyof typeof newExam].toString().trim() === "") {
        toast({
          title: "Missing Field",
          description: `${field.label} is required!`,
          variant: "destructive"
        });
        return;
      }
    }
    // Get token from localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    console.log('Token from localStorage:', token); // Debug log
    
    if (!token) {
      toast({ 
        title: "Authentication Error", 
        description: "No authentication token found. Please log out and log in again.", 
        variant: "destructive" 
      });
      return;
    }
    try {
      setIsLoading(true);
      const response = await fetch('https://exam-registration-system-6ncs.onrender.com/api/exams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify(newExam),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || data.message || 'Failed to create exam');
      }

      toast({
        title: "Success",
        description: "Exam created successfully",
      });

      // Refresh exams list
      await fetchExams();
      setIsAddDialogOpen(false);
      setNewExam({
        name: "",
        date: "",
        time: "",
        duration: "",
        total_marks: "",
        registration_deadline: "",
        fee: ""
      });
    } catch (error) {
      console.error('Error creating exam:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create exam",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditExam = (exam: Exam) => {
    setSelectedExam(exam);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedExam) return;
    
    try {
      setIsLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        throw new Error('Authentication required');
      }
      const response = await fetch(`https://exam-registration-system-6ncs.onrender.com/api/exams/${selectedExam.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(selectedExam),
      });

      if (!response.ok) {
        throw new Error('Failed to update exam');
      }

      toast({
        title: "Success",
        description: "Exam updated successfully",
      });

      // Refresh exams list
      await fetchExams();
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Error updating exam:', error);
      toast({
        title: "Error",
        description: "Failed to update exam",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteExam = (exam: Exam) => {
    setSelectedExam(exam);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedExam) return;
    
    try {
      setIsLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`https://exam-registration-system-6ncs.onrender.com/api/exams/${selectedExam.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete exam');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to delete exam');
      }

      toast({
        title: "Success",
        description: "Exam deleted successfully",
      });

      // Refresh exams list
      await fetchExams();
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error deleting exam:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete exam",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md">
        <div className="p-4">
          <h2 className="text-xl font-bold">Admin Dashboard</h2>
        </div>
        <nav className="mt-4">
          <Link href="/dashboard/admin" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100">
            <Home className="w-5 h-5 mr-2" />
            Dashboard
          </Link>
          <Link href="/dashboard/admin/exams" className="flex items-center px-4 py-2 text-gray-700 bg-gray-100">
            <BookOpen className="w-5 h-5 mr-2" />
            Exams
          </Link>
          <Link href="/dashboard/admin/registrations" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100">
            <Users className="w-5 h-5 mr-2" />
            Registrations
          </Link>
          <Link href="/dashboard/admin/payments" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100">
            <CreditCard className="w-5 h-5 mr-2" />
            Payments
          </Link>
          <button onClick={() => router.push('/auth/login')} className="flex items-center w-full px-4 py-2 text-gray-700 hover:bg-gray-100">
            <LogOut className="w-5 h-5 mr-2" />
            Logout
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Exams Management</h1>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Exam
          </Button>
        </div>

        {/* Exams Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map((exam) => (
            <Card key={exam.id}>
              <CardHeader>
                <CardTitle>{exam.name}</CardTitle>
                <CardDescription>Date: {exam.date}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p><strong>Time:</strong> {exam.time}</p>
                  <p><strong>Duration:</strong> {exam.duration} minutes</p>
                  <p><strong>Total Marks:</strong> {exam.total_marks}</p>
                  <p><strong>Registration Deadline:</strong> {exam.registration_deadline}</p>
                  <p><strong>Fee:</strong> ₹{exam.fee}</p>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => handleEditExam(exam)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button variant="destructive" onClick={() => handleDeleteExam(exam)}>
                  <Trash className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Add Exam Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Exam</DialogTitle>
              <DialogDescription>Enter the exam details below</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Exam Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={newExam.name}
                  onChange={handleInputChange}
                  placeholder="Enter exam name"
                />
              </div>
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  value={newExam.date}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="time">Time</Label>
                <Input
                  id="time"
                  name="time"
                  type="time"
                  value={newExam.time}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  name="duration"
                  type="number"
                  value={newExam.duration}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="total_marks">Total Marks</Label>
                <Input
                  id="total_marks"
                  name="total_marks"
                  type="number"
                  value={newExam.total_marks}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="registration_deadline">Registration Deadline</Label>
                <Input
                  id="registration_deadline"
                  name="registration_deadline"
                  type="date"
                  value={newExam.registration_deadline}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="fee">Fee</Label>
                <Input
                  id="fee"
                  name="fee"
                  type="number"
                  value={newExam.fee}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAddExam} disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Exam"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Exam Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Exam</DialogTitle>
              <DialogDescription>Update the exam details below</DialogDescription>
            </DialogHeader>
            {selectedExam && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-name">Exam Name</Label>
                  <Input
                    id="edit-name"
                    value={selectedExam.name}
                    onChange={(e) => setSelectedExam({ ...selectedExam, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-date">Date</Label>
                  <Input
                    id="edit-date"
                    type="date"
                    value={selectedExam.date}
                    onChange={(e) => setSelectedExam({ ...selectedExam, date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-time">Time</Label>
                  <Input
                    id="edit-time"
                    type="time"
                    value={selectedExam.time}
                    onChange={(e) => setSelectedExam({ ...selectedExam, time: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-duration">Duration (minutes)</Label>
                  <Input
                    id="edit-duration"
                    type="number"
                    value={selectedExam.duration}
                    onChange={(e) => setSelectedExam({ ...selectedExam, duration: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-total_marks">Total Marks</Label>
                  <Input
                    id="edit-total_marks"
                    type="number"
                    value={selectedExam.total_marks}
                    onChange={(e) => setSelectedExam({ ...selectedExam, total_marks: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-registration_deadline">Registration Deadline</Label>
                  <Input
                    id="edit-registration_deadline"
                    type="date"
                    value={selectedExam.registration_deadline}
                    onChange={(e) => setSelectedExam({ ...selectedExam, registration_deadline: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-fee">Fee</Label>
                  <Input
                    id="edit-fee"
                    type="number"
                    value={selectedExam.fee}
                    onChange={(e) => setSelectedExam({ ...selectedExam, fee: e.target.value })}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveEdit} disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Exam</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this exam? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleConfirmDelete} disabled={isLoading}>
                {isLoading ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
