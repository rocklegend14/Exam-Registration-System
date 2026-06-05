const db = require('../models/db');

const processPayment = async (req, res) => {
    try {
        console.log('Payment request received:', req.body);
        const { registration_id, student_id, exam_id, amount, payment_method, card_details } = req.body;
        
        // Check if we have either registration_id OR both student_id and exam_id
        if ((!registration_id && (!student_id || !exam_id)) || !amount || !payment_method) {
            return res.status(400).json({
                success: false,
                message: 'Either Registration ID or both Student ID and Exam ID are required, along with amount and payment method'
            });
        }

        try {
            // First check if the payments table exists and has the right structure
            const [tables] = await db.execute("SHOW TABLES LIKE 'payments'");
            if (tables.length === 0) {
                return res.status(500).json({
                    success: false,
                    message: 'Payments table does not exist. Please run migratePayments.js first.'
                });
            }
            
            // Check the structure of the payments table
            const [columns] = await db.execute('DESCRIBE payments');
            console.log('Payments table columns:', columns.map(col => col.Field));
            
            let studentIdForPayment, examIdForPayment;
            
            if (registration_id) {
                // If registration_id is provided, get student_id and exam_id from the registration
                const [registrations] = await db.execute(
                    'SELECT er.student_id, er.exam_id, e.fee FROM exam_registrations er JOIN exams e ON er.exam_id = e.id WHERE er.id = ?',
                    [registration_id]
                );

                console.log('Registration check result:', registrations);

                if (registrations.length === 0) {
                    return res.status(404).json({
                        success: false,
                        message: 'Registration not found'
                    });
                }
                
                // Use the student_id and exam_id from the registration
                const registration = registrations[0];
                studentIdForPayment = registration.student_id;
                examIdForPayment = registration.exam_id;
            } else {
                // Use the provided student_id and exam_id
                studentIdForPayment = student_id;
                examIdForPayment = exam_id;
                
                // Verify the student and exam exist
                const [students] = await db.execute('SELECT id FROM students WHERE id = ?', [studentIdForPayment]);
                if (students.length === 0) {
                    return res.status(404).json({
                        success: false,
                        message: 'Student not found'
                    });
                }
                
                const [exams] = await db.execute('SELECT id, fee FROM exams WHERE id = ?', [examIdForPayment]);
                if (exams.length === 0) {
                    return res.status(404).json({
                        success: false,
                        message: 'Exam not found'
                    });
                }
            }
            
            // Verify registration exists
            const [registrations] = await db.execute(
                'SELECT er.id, e.fee FROM exam_registrations er JOIN exams e ON er.exam_id = e.id WHERE er.student_id = ? AND er.exam_id = ?',
                [studentIdForPayment, examIdForPayment]
            );

            console.log('Registration check result:', registrations);

            if (registrations.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Student is not registered for this exam'
                });
            }

            // Get the registration ID
            const registrationId = registrations[0].id;
            
            // Verify payment amount matches exam fee
            const examFee = registrations[0].fee;
            console.log('Exam fee:', examFee, 'Payment amount:', amount);
            
            // Convert to numbers for comparison with some tolerance for floating point
            const regFee = parseFloat(examFee);
            const payAmount = parseFloat(amount);
            
            if (Math.abs(regFee - payAmount) > 0.01) {
                return res.status(400).json({
                    success: false,
                    message: `Payment amount does not match exam fee. Expected: ${regFee}, Got: ${payAmount}`
                });
            }

            // Verify payment not already made
            console.log('Checking for existing payments for registration ID:', registrationId);
            const [existingPayments] = await db.execute(
                'SELECT id FROM payments WHERE registration_id = ? AND status = "completed"',
                [registrationId]
            );

            console.log('Existing payments check:', existingPayments);

            if (existingPayments.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Payment has already been made for this exam'
                });
            }

            // Generate a random transaction ID
            const transactionId = 'TXN' + Math.floor(Math.random() * 1000000);
            
            // Prepare card details for storage - ensure it's a valid JSON string
            let cardDetailsJson = '{}';
            if (card_details) {
                try {
                    if (typeof card_details === 'string') {
                        // If it's already a string, validate it's valid JSON
                        JSON.parse(card_details);
                        cardDetailsJson = card_details;
                    } else {
                        // If it's an object, convert to JSON string
                        cardDetailsJson = JSON.stringify(card_details);
                    }
                } catch (e) {
                    console.error('Invalid card details JSON:', e);
                    cardDetailsJson = '{}';
                }
            }
            
            // Begin transaction
            const connection = await db.getConnection();
            try {
                await connection.beginTransaction();
                
                // Insert payment record
                const [result] = await connection.execute(
                    'INSERT INTO payments (registration_id, amount, payment_method, card_details, transaction_id, status) VALUES (?, ?, ?, ?, ?, "completed")',
                    [registrationId, amount, payment_method, cardDetailsJson, transactionId]
                );
                
                console.log('Payment inserted:', result);
                
                // Update registration status if needed
                try {
                    await connection.execute(
                        'UPDATE exam_registrations SET payment_status = "paid" WHERE id = ?',
                        [registrationId]
                    );
                } catch (updateError) {
                    console.error('Error updating registration payment status:', updateError);
                    // We can still commit the transaction as the payment record is the critical part
                }
                
                await connection.commit();
                
                // Return success response
                return res.status(201).json({
                    success: true,
                    message: 'Payment processed successfully',
                    data: {
                        payment_id: result.insertId,
                        transaction_id: transactionId,
                        status: 'completed',
                        payment_date: new Date()
                    }
                });
            } catch (transactionError) {
                await connection.rollback();
                throw transactionError;
            } finally {
                connection.release();
            }
        } catch (dbError) {
            console.error('Database operation error:', dbError);
            throw new Error(`Database operation failed: ${dbError.message}`);
        }
    } catch (error) {
        console.error('Error processing payment:', error);
        return res.status(500).json({
            success: false,
            message: 'Error processing payment',
            error: error.message
        });
    }
};

const getPaymentStatus = async (req, res) => {
    try {
        const registrationId = req.params.registrationId;
        
        if (!registrationId) {
            return res.status(400).json({
                success: false,
                message: 'Registration ID is required'
            });
        }

        const [payments] = await db.execute(
            `SELECT p.id, p.amount, p.payment_date, p.payment_method, p.transaction_id, p.status,
                    er.student_id, er.exam_id, e.name as exam_name, e.fee as exam_fee
             FROM payments p
             JOIN exam_registrations er ON p.registration_id = er.id
             JOIN exams e ON er.exam_id = e.id
             WHERE p.registration_id = ?`,
            [registrationId]
        );

        if (payments.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No payment found for this registration'
            });
        }

        return res.status(200).json({
            success: true,
            data: payments[0]
        });
    } catch (error) {
        console.error('Error fetching payment status:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching payment status',
            error: error.message
        });
    }
};

const getAllPayments = async (req, res) => {
    try {
        const studentId = req.query.student_id;
        
        let query = `
            SELECT p.id, p.amount, p.payment_date, p.payment_method, p.transaction_id, p.status,
                   er.student_id, er.exam_id, 
                   s.name as student_name, s.roll_number,
                   e.name as exam_name, e.fee as exam_fee
            FROM payments p
            JOIN exam_registrations er ON p.registration_id = er.id
            JOIN students s ON er.student_id = s.id
            JOIN exams e ON er.exam_id = e.id
        `;
        
        let params = [];
        
        if (studentId) {
            query += ' WHERE er.student_id = ?';
            params.push(studentId);
        }
        
        query += ' ORDER BY p.payment_date DESC';
        
        const [payments] = await db.execute(query, params);

        return res.status(200).json({
            success: true,
            data: payments
        });
    } catch (error) {
        console.error('Error fetching payments:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching payments',
            error: error.message
        });
    }
};

module.exports = {
    processPayment,
    getPaymentStatus,
    getAllPayments
}; 