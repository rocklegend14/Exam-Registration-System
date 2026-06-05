const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// Process payment for an exam registration
router.post('/', paymentController.processPayment);

// Get payment status for a registration
router.get('/status/:registrationId', paymentController.getPaymentStatus);

// Get all payments (with optional student_id filter)
router.get('/', paymentController.getAllPayments);

module.exports = router;
