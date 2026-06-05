const Exam = require('../models/examModel');
const Payment = require('../models/paymentModel');
const db = require('../models/db');

const getAllExams = async (req, res) => {
    try {
        const [exams] = await db.execute('SELECT * FROM exams ORDER BY date');
        res.status(200).json({
            success: true,
            data: exams
        });
    } catch (error) {
        console.error('Error fetching exams:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching exams',
            error: error.message
        });
    }
};

const getAllRegistrations = async (req, res) => {
    try {
        // First, check if the seat_allocations table exists
        const [tables] = await db.execute(
            `SELECT TABLE_NAME 
             FROM information_schema.TABLES 
             WHERE TABLE_SCHEMA = DATABASE() 
             AND TABLE_NAME = 'seat_allocations'`
        );
        
        const seatAllocationsExists = tables.length > 0;
        
        // Use a query that works whether or not the seat_allocations table exists
        let query = `
            SELECT er.id, er.registration_date, 
                   s.id as student_id, s.name as student_name, 
                   s.roll_number, s.department,
                   e.id as exam_id, e.name as exam_title, e.date, e.time, e.duration, e.fee,
                   CASE WHEN p.id IS NOT NULL THEN 'paid' ELSE 'unpaid' END as payment_status,
                   p.payment_date`;
                   
        if (seatAllocationsExists) {
            query += `, sa.seat_number, sa.exam_center, sa.exam_room`;
        } else {
            query += `, NULL as seat_number, NULL as exam_center, NULL as exam_room`;
        }
        
        query += `
            FROM exam_registrations er
            JOIN students s ON er.student_id = s.id
            JOIN exams e ON er.exam_id = e.id
            LEFT JOIN payments p ON p.registration_id = er.id`;
            
        if (seatAllocationsExists) {
            query += ` LEFT JOIN seat_allocations sa ON sa.registration_id = er.id`;
        }
        
        query += ` ORDER BY er.registration_date DESC`;
        
        const [registrations] = await db.execute(query);
        
        res.status(200).json({
            success: true,
            data: registrations
        });
    } catch (error) {
        console.error('Error fetching registrations:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching registrations',
            error: error.message
        });
    }
};

const createExam = async (req, res) => {
    try {
        const examId = await Exam.create(req.body);
        res.status(201).json({
            success: true,
            message: 'Exam created successfully',
            data: { id: examId }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating exam',
            error: error.message
        });
    }
};

const getExamById = async (req, res) => {
    try {
        const exam = await Exam.getById(req.params.id);
        if (!exam) {
            return res.status(404).json({
                success: false,
                message: 'Exam not found'
            });
        }
        res.status(200).json({
            success: true,
            data: exam
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching exam',
            error: error.message
        });
    }
};

const updateExam = async (req, res) => {
    try {
        const updated = await Exam.update(req.params.id, req.body);
        if (!updated) {
            return res.status(404).json({
                success: false,
                message: 'Exam not found'
            });
        }
        res.status(200).json({
            success: true,
            message: 'Exam updated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating exam',
            error: error.message
        });
    }
};

const deleteExam = async (req, res) => {
    try {
        const deleted = await Exam.delete(req.params.id);
        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'Exam not found'
            });
        }
        res.status(200).json({
            success: true,
            message: 'Exam deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting exam',
            error: error.message
        });
    }
};

const getExamWithRegistrations = async (req, res) => {
    try {
        const examId = req.params.id;
        const [exams] = await db.execute('SELECT * FROM exams WHERE id = ?', [examId]);
        
        if (exams.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Exam not found'
            });
        }

        const [registrations] = await db.execute(
            `SELECT er.id, er.registration_date, 
                    s.id as student_id, s.name as student_name, 
                    s.roll_number, s.department
            FROM exam_registrations er
            JOIN students s ON er.student_id = s.id
            WHERE er.exam_id = ?
            ORDER BY er.registration_date DESC`,
            [examId]
        );

        res.status(200).json({
            success: true,
            data: {
                exam: exams[0],
                registrations: registrations
            }
        });
    } catch (error) {
        console.error('Error fetching exam details:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching exam details',
            error: error.message
        });
    }
};

const registerForExam = async (req, res) => {
    try {
        const { student_id, exam_id } = req.body;
        console.log('Received data:', { student_id, exam_id });

        if (!student_id || !exam_id) {
            return res.status(400).json({
                success: false,
                message: 'Student ID and Exam ID are required'
            });
        }

        const [students] = await db.execute('SELECT id FROM students WHERE id = ?', [student_id]);
        console.log('Student check:', students);
        if (students.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        // Commented out deadline check for testing purposes
        /*
        const [exams] = await db.execute(
            'SELECT id FROM exams WHERE id = ? AND registration_deadline >= CURDATE()',
            [exam_id]
        );
        console.log('Exam check:', exams);
        if (exams.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Exam not found or registration deadline has passed'
            });
        }
        */
        
        // Instead, just check if the exam exists
        const [exams] = await db.execute(
            'SELECT id FROM exams WHERE id = ?',
            [exam_id]
        );
        console.log('Exam check:', exams);
        if (exams.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Exam not found'
            });
        }

        const [existing] = await db.execute(
            'SELECT id FROM exam_registrations WHERE student_id = ? AND exam_id = ?',
            [student_id, exam_id]
        );
        console.log('Existing registration check:', existing);
        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Student is already registered for this exam'
            });
        }

        const connection = await db.getConnection();
        try {
            await connection.execute('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');
            await connection.beginTransaction();

            const [insertResult] = await connection.execute(
                'INSERT INTO exam_registrations (student_id, exam_id, registration_date) VALUES (?, ?, NOW())',
                [student_id, exam_id]
            );
            console.log('Insert result:', insertResult);

            if (insertResult.affectedRows !== 1) {
                throw new Error('Insert failed: No rows affected');
            }

            const [newRecord] = await connection.execute(
                'SELECT id, student_id, exam_id, registration_date FROM exam_registrations WHERE student_id = ? AND exam_id = ?',
                [student_id, exam_id]
            );
            console.log('New record check:', newRecord);

            if (newRecord.length === 0) {
                throw new Error('Insert succeeded but record not found');
            }

            await connection.commit();
            res.status(201).json({
                success: true,
                message: 'Successfully registered for exam',
                data: newRecord[0]
            });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error registering for exam:', error);
        res.status(500).json({
            success: false,
            message: 'Error registering for exam',
            error: error.message
        });
    }
};

// Get registrations for a specific student
const getStudentRegistrations = async (req, res) => {
    try {
        const studentId = req.query.student_id;
        
        if (!studentId) {
            return res.status(400).json({
                success: false,
                message: 'Student ID is required'
            });
        }

        console.log('Fetching registrations for student ID:', studentId);

        // First, check if the seat_allocations table exists
        const [seatAllocationsTable] = await db.execute(
            `SELECT TABLE_NAME 
             FROM information_schema.TABLES 
             WHERE TABLE_SCHEMA = DATABASE() 
             AND TABLE_NAME = 'seat_allocations'`
        );
        
        // Check if the rooms table exists
        const [roomsTable] = await db.execute(
            `SELECT TABLE_NAME 
             FROM information_schema.TABLES 
             WHERE TABLE_SCHEMA = DATABASE() 
             AND TABLE_NAME = 'rooms'`
        );
        
        const seatAllocationsExists = seatAllocationsTable.length > 0;
        const roomsExists = roomsTable.length > 0;
        
        // Base query with common tables
        let query = `
            SELECT er.id, er.registration_date, er.exam_id,
                   s.id as student_id, s.name as student_name, 
                   s.roll_number, s.department,
                   e.id as exam_id, e.name as exam_title, e.date, e.time, e.duration, e.fee,
                   e.venue as exam_venue,
                   CASE WHEN p.id IS NOT NULL AND (p.status = 'completed' OR p.status = 'paid') THEN 'paid' ELSE 'unpaid' END as payment_status,
                   p.payment_date`;
        
        // Add seat allocation columns based on table existence
        if (seatAllocationsExists) {
            // If both tables exist, use proper join
            if (roomsExists) {
                query += `, 
                   sa.seat_number, 
                   r.name as exam_room,
                   r.building as exam_center`;
            } else {
                // If only seat_allocations exists but not rooms, use seat info without room details
                query += `, 
                   sa.seat_number,
                   'Room Info Pending' as exam_room, 
                   e.venue as exam_center`;
            }
        } else {
            // If neither table exists, use placeholders
            query += `, NULL as seat_number, NULL as exam_room, e.venue as exam_center`;
        }
        
        // Base table joins
        query += `
            FROM exam_registrations er
            JOIN students s ON er.student_id = s.id
            JOIN exams e ON er.exam_id = e.id
            LEFT JOIN payments p ON p.registration_id = er.id`;
        
        // Add seat allocation and room joins based on table existence
        if (seatAllocationsExists) {
            query += ` LEFT JOIN seat_allocations sa ON sa.registration_id = er.id`;
            
            if (roomsExists) {
                query += ` LEFT JOIN rooms r ON sa.room_id = r.id`;
            }
        }
        
        query += ` WHERE er.student_id = ?
                 ORDER BY er.registration_date DESC`;
        
        const [registrations] = await db.execute(query, [studentId]);

        console.log('Found registrations:', registrations.length);

        // Format the data for the frontend
        const formattedRegistrations = registrations.map(reg => {
            const isPaid = reg.payment_status === 'paid';
            // Check if seat is allocated - if seat_allocations doesn't exist, we'll use payment status
            const hasSeatAllocation = seatAllocationsExists 
                ? (reg.seat_number !== null && reg.seat_number !== undefined) 
                : isPaid; // If no seat allocations table, assume paid = seat allocated
            
            return {
                ...reg,
                seat_number: reg.seat_number || 'Not Assigned',
                exam_center: reg.exam_center || 'Not Assigned',
                exam_room: reg.exam_room || 'Not Assigned',
                admit_card_available: isPaid && hasSeatAllocation
            };
        });

        res.status(200).json({
            success: true,
            data: formattedRegistrations
        });
    } catch (error) {
        console.error('Error fetching student registrations:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching student registrations',
            error: error.message
        });
    }
};

// Get admit card data for a specific exam and student
const getAdmitCard = async (req, res) => {
    try {
        const { examId, studentId } = req.params;
        
        if (!examId || !studentId) {
            return res.status(400).json({
                success: false,
                message: 'Exam ID and Student ID are required'
            });
        }

        console.log('Fetching admit card for exam ID:', examId, 'and student ID:', studentId);

        // First check if the student is registered for this exam
        const [registrations] = await db.execute(
            `SELECT er.id as registration_id
             FROM exam_registrations er
             WHERE er.exam_id = ? AND er.student_id = ?`,
            [examId, studentId]
        );

        if (registrations.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Student is not registered for this exam'
            });
        }

        const registration = registrations[0];

        // Check if payment has been made
        const [payments] = await db.execute(
            `SELECT id, transaction_id, payment_date 
             FROM payments 
             WHERE registration_id = ? AND status = 'completed'`,
            [registration.registration_id]
        );

        const isPaid = payments.length > 0;
        
        // Get student details regardless of payment status
        const [students] = await db.execute(
            `SELECT s.name as student_name, s.roll_number as student_id, s.email as student_email
             FROM students s
             WHERE s.id = ?`,
            [studentId]
        );

        if (students.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        const student = students[0];

        // Get exam details
        const [exams] = await db.execute(
            `SELECT e.name as exam_name, e.date as exam_date, e.time as exam_time, 
                    e.duration as exam_duration, e.venue as exam_venue, e.fee as exam_fee
             FROM exams e
             WHERE e.id = ?`,
            [examId]
        );

        if (exams.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Exam not found'
            });
        }

        const exam = exams[0];

        // Format date and time
        const examDate = new Date(exam.exam_date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // If not paid, return payment required message with student and exam info
        if (!isPaid) {
            return res.status(403).json({
                success: false,
                message: 'Payment is required to access admit card',
                isPaid: false,
                studentName: student.student_name,
                examName: exam.exam_name,
                examFee: exam.exam_fee
            });
        }

        // Payment is verified, prepare admit card data
        const payment = payments[0];
        
        // Prepare admit card data
        const admitCardData = {
            studentName: student.student_name,
            studentId: student.student_id,
            studentEmail: student.student_email,
            examName: exam.exam_name,
            examDate: examDate,
            examTime: exam.exam_time,
            examDuration: `${exam.exam_duration} hours`,
            seatNumber: 'A' + Math.floor(Math.random() * 100 + 1), // Generate a random seat number
            examCenter: exam.exam_venue || 'Main Campus',
            examRoom: 'Room ' + Math.floor(Math.random() * 20 + 101), // Generate a random room number
            isPaid: true,
            paymentDate: new Date(payment.payment_date).toLocaleDateString(),
            transactionId: payment.transaction_id
        };

        res.status(200).json({
            success: true,
            data: admitCardData
        });
    } catch (error) {
        console.error('Error fetching admit card data:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching admit card data',
            error: error.message
        });
    }
};

// Create seat_allocations table if it doesn't exist
const createSeatAllocationsTable = async () => {
    try {
        await db.execute(`
            CREATE TABLE IF NOT EXISTS seat_allocations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                registration_id INT NOT NULL,
                student_id INT NOT NULL,
                exam_id INT NOT NULL,
                seat_number VARCHAR(20) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (registration_id) REFERENCES exam_registrations(id),
                FOREIGN KEY (student_id) REFERENCES students(id),
                FOREIGN KEY (exam_id) REFERENCES exams(id)
            )
        `);
        console.log('seat_allocations table created or already exists');
        return true;
    } catch (error) {
        console.error('Error creating seat_allocations table:', error);
        return false;
    }
};

// Allocate a seat for a student after payment
const allocateSeat = async (req, res) => {
    try {
        const { registration_id, exam_id, student_id } = req.body;
        
        if (!registration_id || !exam_id || !student_id) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: registration_id, exam_id, and student_id are required'
            });
        }

        // First check if registration exists and is paid
        const [registrations] = await db.execute(
            `SELECT er.id, er.exam_id, er.student_id, p.id as payment_id, p.status as payment_status,
                    e.name as exam_name, e.venue as exam_venue 
             FROM exam_registrations er
             JOIN exams e ON er.exam_id = e.id
             LEFT JOIN payments p ON er.id = p.registration_id
             WHERE er.id = ? AND er.student_id = ? AND er.exam_id = ?`,
            [registration_id, student_id, exam_id]
        );

        if (registrations.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Registration not found or does not match the provided student and exam'
            });
        }

        const registration = registrations[0];
        
        // Verify payment
        if (!registration.payment_id || registration.payment_status !== 'completed') {
            return res.status(400).json({
                success: false,
                message: 'Payment not found or not completed for this registration'
            });
        }

        // First, check if seat_allocations table exists
        try {
            const [tableCheck] = await db.execute(
                `SELECT 1 FROM seat_allocations LIMIT 1`
            );
        } catch (error) {
            // If table doesn't exist, create it
            console.log('Creating seat_allocations table');
            await db.execute(`
                CREATE TABLE IF NOT EXISTS seat_allocations (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    registration_id INT NOT NULL UNIQUE,
                    exam_id INT NOT NULL,
                    student_id INT NOT NULL,
                    seat_number VARCHAR(50) NOT NULL,
                    exam_center VARCHAR(255) NOT NULL,
                    exam_room VARCHAR(100) NOT NULL,
                    allocation_date DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);
        }

        // Check if seat is already allocated
        const [existingSeats] = await db.execute(
            `SELECT * FROM seat_allocations WHERE registration_id = ?`,
            [registration_id]
        );

        if (existingSeats.length > 0) {
            return res.status(200).json({
                success: true,
                message: 'Seat already allocated',
                data: existingSeats[0]
            });
        }

        // Generate seat number - count existing allocations for this exam + 1
        const [seatCountResult] = await db.execute(
            `SELECT COUNT(*) as count FROM seat_allocations WHERE exam_id = ?`,
            [exam_id]
        );
        
        const seatNumber = seatCountResult[0].count + 1;
        const seatCode = `A${seatNumber < 10 ? '0' : ''}${seatNumber}`;
        const roomName = `Hall ${Math.floor(seatNumber / 30) + 1}`;
        
        // Insert seat allocation with basic room information
        const [result] = await db.execute(
            `INSERT INTO seat_allocations 
             (registration_id, exam_id, student_id, seat_number, exam_center, exam_room, allocation_date)
             VALUES (?, ?, ?, ?, ?, ?, NOW())`,
            [
                registration_id, 
                exam_id, 
                student_id, 
                seatCode,
                registration.exam_venue || 'Main Campus', 
                roomName
            ]
        );

        if (!result.insertId) {
            throw new Error('Failed to allocate seat');
        }

        // Get the created allocation
        const [allocations] = await db.execute(
            `SELECT * FROM seat_allocations WHERE id = ?`,
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            message: 'Seat allocated successfully',
            data: allocations[0]
        });
    } catch (error) {
        console.error('Error allocating seat:', error);
        res.status(500).json({
            success: false,
            message: 'Error allocating seat',
            error: error.message
        });
    }
};

// Auto-allocate seats for all paid registrations without seat allocations
const autoAllocateSeats = async (req, res) => {
    try {
        // Ensure the seat_allocations table exists
        await createSeatAllocationsTable();
        
        // Get all paid registrations without seat allocations
        // Fix: Use registration_id in payments table to join with exam_registrations
        const [registrations] = await db.execute(
            `SELECT er.id as registration_id, er.student_id, er.exam_id, e.name as exam_name
             FROM exam_registrations er
             JOIN exams e ON er.exam_id = e.id
             JOIN payments p ON p.registration_id = er.id AND p.status = 'completed'
             LEFT JOIN seat_allocations sa ON sa.registration_id = er.id
             WHERE sa.id IS NULL`
        );
        
        if (registrations.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No registrations found that need seat allocation',
                allocatedCount: 0
            });
        }
        
        // Group registrations by exam
        const examGroups = {};
        registrations.forEach(reg => {
            if (!examGroups[reg.exam_id]) {
                examGroups[reg.exam_id] = [];
            }
            examGroups[reg.exam_id].push(reg);
        });
        
        // Auto-allocate seats for each exam
        let totalAllocated = 0;
        
        for (const examId in examGroups) {
            const examRegistrations = examGroups[examId];
            const examName = examRegistrations[0].exam_name;
            
            // Get exam venues
            const [venues] = await db.execute(
                `SELECT venue FROM exams WHERE id = ?`,
                [examId]
            );
            
            const examVenue = venues[0]?.venue || 'Main Campus';
            
            // Allocate seats
            for (let i = 0; i < examRegistrations.length; i++) {
                const reg = examRegistrations[i];
                const seatNumber = `${examName.substring(0, 1)}${i + 101}`; // e.g., M101, M102, etc.
                const roomNumber = `Room ${Math.floor(i / 20) + 1}`; // 20 students per room
                
                // Create seat allocation
                await db.execute(
                    `INSERT INTO seat_allocations 
                     (registration_id, student_id, exam_id, seat_number, exam_center, exam_room, created_at)
                     VALUES (?, ?, ?, ?, ?, ?, NOW())`,
                    [reg.registration_id, reg.student_id, reg.exam_id, seatNumber, examVenue, roomNumber]
                );
                
                totalAllocated++;
            }
        }
        
        res.status(200).json({
            success: true,
            message: `Successfully allocated seats for ${totalAllocated} registrations`,
            allocatedCount: totalAllocated
        });
    } catch (error) {
        console.error('Error auto-allocating seats:', error);
        res.status(500).json({
            success: false,
            message: 'Error auto-allocating seats',
            error: error.message
        });
    }
};

module.exports = {
    getAllExams,
    getExamById,
    createExam,
    updateExam,
    deleteExam,
    getExamWithRegistrations,
    registerForExam,
    getAllRegistrations,
    getStudentRegistrations,
    getAdmitCard,
    allocateSeat,
    autoAllocateSeats
};