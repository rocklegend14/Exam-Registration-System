// routes/examRoutes.js
const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');
const { authenticate, authenticateAdmin } = require('../middleware/auth');

// Public routes
router.get('/', examController.getAllExams);
router.get('/registrations', examController.getAllRegistrations);
router.get('/student/registrations', examController.getStudentRegistrations);
router.get('/:id/registrations', examController.getExamWithRegistrations);
router.post('/register', examController.registerForExam);
router.get('/admit-card/:examId/:studentId', examController.getAdmitCard);
router.post('/allocate-seat', authenticate, examController.allocateSeat);

// Admin routes
router.post('/', authenticate, authenticateAdmin, examController.createExam);
router.post('/auto-allocate', authenticate, authenticateAdmin, examController.autoAllocateSeats);
router.get('/:id', examController.getExamById);
router.put('/:id', authenticate, authenticateAdmin, examController.updateExam);
router.delete('/:id', authenticate, authenticateAdmin, examController.deleteExam);

module.exports = router;