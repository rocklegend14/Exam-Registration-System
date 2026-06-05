const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Student = require('../models/studentModel');
const Exam = require('../models/examModel');
const Payment = require('../models/paymentModel');
const db = require('../models/db');
require('dotenv').config();

class StudentController {
    static async register(req, res) {
        try {
            const { name, email, password, roll_number, department } = req.body;

            // Check if student already exists
            const [existingStudents] = await db.execute(
                'SELECT id FROM students WHERE email = ? OR roll_number = ?',
                [email, roll_number]
            );

            if (existingStudents.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Student already exists with this email or roll number'
                });
            }

            // Hash password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            // Create student
            const [result] = await db.execute(
                'INSERT INTO students (name, email, password, roll_number, department) VALUES (?, ?, ?, ?, ?)',
                [name, email, hashedPassword, roll_number, department]
            );

            // Create token
            const token = jwt.sign(
                { id: result.insertId, email },
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: '1d' }
            );

            res.status(201).json({
                success: true,
                message: 'Student registered successfully',
                token,
                data: {
                    id: result.insertId,
                    name,
                    email,
                    roll_number,
                    department
                }
            });
        } catch (error) {
            console.error('Error in student registration:', error);
            res.status(500).json({
                success: false,
                message: 'Error registering student',
                error: error.message
            });
        }
    }

    static async login(req, res) {
        try {
            const { email, password } = req.body;

            // Check if email and password are provided
            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Email and password are required'
                });
            }

            // Get student from database
            const [students] = await db.execute(
                'SELECT * FROM students WHERE email = ?',
                [email]
            );

            if (students.length === 0) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }

            const student = students[0];

            // Check password
            const isMatch = await bcrypt.compare(password, student.password);
            if (!isMatch) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }

            // Create token
            const token = jwt.sign(
                { id: student.id, email: student.email },
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: '1d' }
            );

            res.status(200).json({
                success: true,
                message: 'Login successful',
                token,
                data: {
                    id: student.id,
                    name: student.name,
                    email: student.email,
                    roll_number: student.roll_number,
                    department: student.department
                }
            });
        } catch (error) {
            console.error('Error in student login:', error);
            res.status(500).json({
                success: false,
                message: 'Error logging in',
                error: error.message
            });
        }
    }

    static async getProfile(req, res) {
        try {
            const student = await Student.findById(req.user.id);
            if (!student) {
                return res.status(404).json({ message: 'Student not found' });
            }

            // Remove password from response
            const { password, ...studentWithoutPassword } = student;
            res.json(studentWithoutPassword);
        } catch (error) {
            console.error('Profile error:', error);
            res.status(500).json({ message: 'Error fetching profile', error: error.message });
        }
    }

    static async registerForExam(req, res) {
        try {
            const { examId } = req.body;
            const studentId = req.user.id;

            // Validate examId
            if (!examId) {
                return res.status(400).json({ message: 'Exam ID is required' });
            }

            // Check if payment is verified
            const paymentVerified = await Payment.verifyPayment(studentId, examId);
            if (!paymentVerified) {
                return res.status(400).json({ message: 'Payment not verified' });
            }

            // Register for exam
            await Exam.registerStudent(examId, studentId);
            res.json({ message: 'Successfully registered for exam' });
        } catch (error) {
            console.error('Exam registration error:', error);
            res.status(500).json({ message: 'Error registering for exam', error: error.message });
        }
    }

    static async getRegisteredExams(req, res) {
        try {
            const studentId = req.user.id;
            // You should ensure that db is set up correctly with a database connection
            const [exams] = await db.execute(
                `SELECT e.* FROM exams e 
                JOIN exam_registrations er ON e.id = er.exam_id 
                WHERE er.student_id = ?`, 
                [studentId]
            );

            res.json(exams);
        } catch (error) {
            console.error('Get registered exams error:', error);
            res.status(500).json({ message: 'Error fetching registered exams', error: error.message });
        }
    }
}

module.exports = StudentController;
