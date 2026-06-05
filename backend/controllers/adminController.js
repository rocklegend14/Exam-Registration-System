const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../models/db');
require('dotenv').config();

// Admin registration method
const register = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Check if username and password are provided
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username and password are required'
            });
        }

        // Check if admin already exists
        const [existingAdmins] = await db.execute('SELECT * FROM admins WHERE username = ?', [username]);
        if (existingAdmins.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Admin already exists'
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create admin
        const [result] = await db.execute(
            'INSERT INTO admins (username, password) VALUES (?, ?)',
            [username, hashedPassword]
        );

        res.status(201).json({
            success: true,
            message: 'Admin registered successfully',
            data: {
                id: result.insertId,
                username
            }
        });
    } catch (error) {
        console.error('Error in admin registration:', error);
        res.status(500).json({
            success: false,
            message: 'Error registering admin',
            error: error.message
        });
    }
};

// Admin login method
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if both email and password are provided
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Get admin from the database by username (using email as username)
        const [rows] = await db.execute('SELECT * FROM admins WHERE username = ?', [email]);
        const admin = rows[0];

        if (!admin) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Compare the provided password with the hashed password in the database
        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Create token
        const token = jwt.sign(
            { id: admin.id, username: admin.username, role: 'admin' },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '1d' }
        );

        // Set token as cookie for browser requests
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000 // 1 day
        });

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                id: admin.id,
                name: admin.username, 
                username: admin.username
            },
            token
        });
    } catch (error) {
        console.error('Error in admin login:', error);
        res.status(500).json({
            success: false,
            message: 'Error logging in',
            error: error.message
        });
    }
};

// Get all students
const getAllStudents = async (req, res) => {
    try {
        const [students] = await db.execute('SELECT * FROM students');
        res.status(200).json({
            success: true,
            data: students
        });
    } catch (error) {
        console.error('Error getting students:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting students',
            error: error.message
        });
    }
};

// Get student details
const getStudentDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const [student] = await db.execute('SELECT * FROM students WHERE id = ?', [id]);
        
        if (student.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        res.status(200).json({
            success: true,
            data: student[0]
        });
    } catch (error) {
        console.error('Error getting student details:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting student details',
            error: error.message
        });
    }
};

// Get exam statistics
const getExamStatistics = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Get exam details
        const [exam] = await db.execute('SELECT * FROM exams WHERE id = ?', [id]);
        if (exam.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Exam not found'
            });
        }

        // Get registration count
        const [registrations] = await db.execute(
            'SELECT COUNT(*) as count FROM exam_registrations WHERE exam_id = ?',
            [id]
        );

        res.status(200).json({
            success: true,
            data: {
                exam: exam[0],
                registrations: registrations[0].count
            }
        });
    } catch (error) {
        console.error('Error getting exam statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting exam statistics',
            error: error.message
        });
    }
};

module.exports = {
    register,
    login,
    getAllStudents,
    getStudentDetails,
    getExamStatistics
};
