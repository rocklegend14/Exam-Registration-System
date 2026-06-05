// models/paymentModel.js
const db = require('../models/db');  // Correctly import db.js

// Define the Payment model using Sequelize ORM or raw SQL queries
const Payment = {
    create: async (paymentData) => {
        try {
            const query = 'INSERT INTO payments (student_id, exam_id, amount, transaction_id, status) VALUES (?, ?, ?, ?, ?)';
            const params = [paymentData.student_id, paymentData.exam_id, paymentData.amount, paymentData.transaction_id, paymentData.status];
            const [result] = await db.query(query, params);
            return result;
        } catch (error) {
            console.error('Error creating payment record:', error);
            throw error;
        }
    },
    updateStatus: async (transactionId, status) => {
        try {
            const query = 'UPDATE payments SET status = ? WHERE transaction_id = ?';
            const params = [status, transactionId];
            const [result] = await db.query(query, params);
            return result;
        } catch (error) {
            console.error('Error updating payment status:', error);
            throw error;
        }
    }
};

module.exports = Payment;
