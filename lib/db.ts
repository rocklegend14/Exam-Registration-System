// This is a mock database service for the exam registration system
// In a real application, this would connect to MySQL

// Types
export interface Exam {
  id: number
  name: string
  date: string
  time: string
  duration: string
  fee: number
  status: "active" | "draft"
  registrations?: number
}

export interface Registration {
  id: number
  studentId: string
  examId: number
  registrationDate: string
  paymentStatus: "paid" | "unpaid"
  seatNumber: string | null
  examCenter: string | null
}

export interface User {
  id: number
  name: string
  email: string
  password: string // In a real app, this would be hashed
  role: "student" | "admin"
  studentId?: string
}

// Mock data
const exams: Exam[] = [
  {
    id: 1,
    name: "Mathematics Final Exam",
    date: "2023-06-15",
    time: "09:00 AM",
    duration: "3 hours",
    fee: 50,
    status: "active",
    registrations: 45,
  },
  {
    id: 2,
    name: "Physics Mid-Term",
    date: "2023-06-20",
    time: "10:00 AM",
    duration: "2 hours",
    fee: 40,
    status: "active",
    registrations: 32,
  },
  {
    id: 3,
    name: "Computer Science Project Defense",
    date: "2023-06-25",
    time: "01:00 PM",
    duration: "1 hour",
    fee: 30,
    status: "active",
    registrations: 28,
  },
  {
    id: 4,
    name: "English Literature Essay",
    date: "2023-06-30",
    time: "11:00 AM",
    duration: "2 hours",
    fee: 35,
    status: "draft",
    registrations: 0,
  },
]

const registrations: Registration[] = [
  {
    id: 1,
    studentId: "S12345",
    examId: 1,
    registrationDate: "2023-05-10",
    paymentStatus: "paid",
    seatNumber: "A123",
    examCenter: "Main Hall",
  },
  {
    id: 2,
    studentId: "S12346",
    examId: 1,
    registrationDate: "2023-05-11",
    paymentStatus: "paid",
    seatNumber: "A124",
    examCenter: "Main Hall",
  },
  {
    id: 3,
    studentId: "S12347",
    examId: 2,
    registrationDate: "2023-05-12",
    paymentStatus: "unpaid",
    seatNumber: null,
    examCenter: null,
  },
  {
    id: 4,
    studentId: "S12345",
    examId: 3,
    registrationDate: "2023-05-15",
    paymentStatus: "unpaid",
    seatNumber: null,
    examCenter: null,
  },
]

const users: User[] = [
  {
    id: 1,
    name: "John Doe",
    email: "john@example.com",
    password: "password123",
    role: "student",
    studentId: "S12345",
  },
  {
    id: 2,
    name: "Admin User",
    email: "admin@example.com",
    password: "admin123",
    role: "admin",
  },
]

// Database operations
export const db = {
  // Exam operations
  exams: {
    getAll: async () => {
      return [...exams]
    },
    getById: async (id: number) => {
      return exams.find((exam) => exam.id === id) || null
    },
    create: async (exam: Omit<Exam, "id">) => {
      const newExam = {
        ...exam,
        id: exams.length + 1,
        registrations: 0,
      }
      exams.push(newExam)
      return newExam
    },
    update: async (id: number, data: Partial<Exam>) => {
      const index = exams.findIndex((exam) => exam.id === id)
      if (index === -1) return null

      exams[index] = { ...exams[index], ...data }
      return exams[index]
    },
    delete: async (id: number) => {
      const index = exams.findIndex((exam) => exam.id === id)
      if (index === -1) return false

      exams.splice(index, 1)
      return true
    },
  },

  // Registration operations
  registrations: {
    getAll: async () => {
      return [...registrations]
    },
    getByStudentId: async (studentId: string) => {
      return registrations.filter((reg) => reg.studentId === studentId)
    },
    getByExamId: async (examId: number) => {
      return registrations.filter((reg) => reg.examId === examId)
    },
    create: async (registration: Omit<Registration, "id">) => {
      const newRegistration = {
        ...registration,
        id: registrations.length + 1,
      }
      registrations.push(newRegistration)

      // Update exam registration count
      const examIndex = exams.findIndex((exam) => exam.id === registration.examId)
      if (examIndex !== -1) {
        exams[examIndex].registrations = (exams[examIndex].registrations || 0) + 1
      }

      return newRegistration
    },
    updatePaymentStatus: async (id: number, status: "paid" | "unpaid") => {
      const index = registrations.findIndex((reg) => reg.id === id)
      if (index === -1) return null

      registrations[index].paymentStatus = status
      return registrations[index]
    },
    allocateSeat: async (id: number, seatNumber: string, examCenter: string) => {
      const index = registrations.findIndex((reg) => reg.id === id)
      if (index === -1) return null

      registrations[index].seatNumber = seatNumber
      registrations[index].examCenter = examCenter
      return registrations[index]
    },
  },

  // User operations
  users: {
    getByEmail: async (email: string) => {
      return users.find((user) => user.email === email) || null
    },
    create: async (user: Omit<User, "id">) => {
      const newUser = {
        ...user,
        id: users.length + 1,
      }
      users.push(newUser)
      return newUser
    },
    authenticate: async (email: string, password: string) => {
      const user = users.find((user) => user.email === email && user.password === password)
      if (!user) return null

      // In a real app, you would generate and return a JWT token here
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
      }
    },
  },
}

