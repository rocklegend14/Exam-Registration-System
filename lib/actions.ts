"use server"

import { db } from "./db"

// Auth actions
export async function login(email: string, password: string) {
  try {
    const user = await db.users.authenticate(email, password)
    return { success: true, user }
  } catch (error) {
    console.error("Login error:", error)
    return { success: false, error: "Invalid credentials" }
  }
}

export async function signup(userData: any) {
  try {
    const existingUser = await db.users.getByEmail(userData.email)
    if (existingUser) {
      return { success: false, error: "Email already in use" }
    }

    const user = await db.users.create(userData)
    return { success: true, user }
  } catch (error) {
    console.error("Signup error:", error)
    return { success: false, error: "Failed to create account" }
  }
}

// Exam actions
export async function getExams() {
  try {
    const exams = await db.exams.getAll()
    return { success: true, exams }
  } catch (error) {
    console.error("Get exams error:", error)
    return { success: false, error: "Failed to fetch exams" }
  }
}

export async function getExamById(id: number) {
  try {
    const exam = await db.exams.getById(id)
    if (!exam) {
      return { success: false, error: "Exam not found" }
    }
    return { success: true, exam }
  } catch (error) {
    console.error("Get exam error:", error)
    return { success: false, error: "Failed to fetch exam" }
  }
}

export async function createExam(examData: any) {
  try {
    const exam = await db.exams.create(examData)
    return { success: true, exam }
  } catch (error) {
    console.error("Create exam error:", error)
    return { success: false, error: "Failed to create exam" }
  }
}

export async function updateExam(id: number, examData: any) {
  try {
    const exam = await db.exams.update(id, examData)
    if (!exam) {
      return { success: false, error: "Exam not found" }
    }
    return { success: true, exam }
  } catch (error) {
    console.error("Update exam error:", error)
    return { success: false, error: "Failed to update exam" }
  }
}

export async function deleteExam(id: number) {
  try {
    const success = await db.exams.delete(id)
    if (!success) {
      return { success: false, error: "Exam not found" }
    }
    return { success: true }
  } catch (error) {
    console.error("Delete exam error:", error)
    return { success: false, error: "Failed to delete exam" }
  }
}

// Registration actions
export async function getRegistrations() {
  try {
    const registrations = await db.registrations.getAll()
    return { success: true, registrations }
  } catch (error) {
    console.error("Get registrations error:", error)
    return { success: false, error: "Failed to fetch registrations" }
  }
}

export async function getStudentRegistrations(studentId: string) {
  try {
    const registrations = await db.registrations.getByStudentId(studentId)
    return { success: true, registrations }
  } catch (error) {
    console.error("Get student registrations error:", error)
    return { success: false, error: "Failed to fetch registrations" }
  }
}

export async function registerForExam(studentId: string, examId: number) {
  try {
    // Check if already registered
    const studentRegistrations = await db.registrations.getByStudentId(studentId)
    const alreadyRegistered = studentRegistrations.some((reg) => reg.examId === examId)

    if (alreadyRegistered) {
      return { success: false, error: "Already registered for this exam" }
    }

    const registration = await db.registrations.create({
      studentId,
      examId,
      registrationDate: new Date().toISOString().split("T")[0],
      paymentStatus: "unpaid",
      seatNumber: null,
      examCenter: null,
    })

    return { success: true, registration }
  } catch (error) {
    console.error("Register for exam error:", error)
    return { success: false, error: "Failed to register for exam" }
  }
}

export async function payExamFee(registrationId: number) {
  try {
    const registration = await db.registrations.updatePaymentStatus(registrationId, "paid")
    if (!registration) {
      return { success: false, error: "Registration not found" }
    }
    return { success: true, registration }
  } catch (error) {
    console.error("Pay exam fee error:", error)
    return { success: false, error: "Failed to process payment" }
  }
}

export async function allocateSeat(registrationId: number, seatNumber: string, examCenter: string) {
  try {
    const registration = await db.registrations.allocateSeat(registrationId, seatNumber, examCenter)
    if (!registration) {
      return { success: false, error: "Registration not found" }
    }
    return { success: true, registration }
  } catch (error) {
    console.error("Allocate seat error:", error)
    return { success: false, error: "Failed to allocate seat" }
  }
}

