const express = require('express');
const router = express.Router();
const StudentController = require('../controllers/studentController');
const { authenticateStudent } = require('../middleware/auth');

// Public routes
router.post('/register', StudentController.register);
router.post('/login', StudentController.login);

// Protected routes (student-specific)
router.get('/profile', authenticateStudent, StudentController.getProfile);
router.post('/exams/register', authenticateStudent, StudentController.registerForExam);
router.get('/exams/registered', authenticateStudent, StudentController.getRegisteredExams);

module.exports = router;
