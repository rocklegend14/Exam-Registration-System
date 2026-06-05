const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateAdmin } = require('../middleware/auth');

// Public routes
router.post('/register', adminController.register);
router.post('/login', adminController.login);

// Protected routes (admin access only)
router.get('/students', authenticateAdmin, adminController.getAllStudents);
router.get('/students/:id', authenticateAdmin, adminController.getStudentDetails);
router.get('/exams/:id/statistics', authenticateAdmin, adminController.getExamStatistics);

module.exports = router;
