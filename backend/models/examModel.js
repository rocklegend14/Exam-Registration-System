const db = require('./db');

class Exam {
    static async create(examData) {
        try {
            // Validate required fields
            const requiredFields = ['name', 'date', 'time', 'duration', 'total_marks', 'registration_deadline', 'fee'];
            for (const field of requiredFields) {
                if (!examData[field]) {
                    throw new Error(`Missing required field: ${field}`);
                }
            }

            const [result] = await db.execute(
                `INSERT INTO exams 
                (name, date, time, duration, total_marks, registration_deadline, fee) 
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    examData.name,
                    examData.date,
                    examData.time,
                    examData.duration,
                    examData.total_marks,
                    examData.registration_deadline,
                    examData.fee
                ]
            );
            return result.insertId;
        } catch (error) {
            console.error('Error creating exam:', error);
            throw error;
        }
    }

    static async getAll() {
        try {
            const [rows] = await db.execute('SELECT * FROM exams ORDER BY date DESC');
            return rows;
        } catch (error) {
            console.error('Error fetching exams:', error);
            throw error;
        }
    }

    static async getById(id) {
        try {
            const [rows] = await db.execute('SELECT * FROM exams WHERE id = ?', [id]);
            return rows[0];
        } catch (error) {
            console.error('Error fetching exam:', error);
            throw error;
        }
    }

    static async update(id, examData) {
        try {
            // Validate required fields
            const requiredFields = ['name', 'date', 'time', 'duration', 'total_marks', 'registration_deadline', 'fee'];
            for (const field of requiredFields) {
                if (!examData[field]) {
                    throw new Error(`Missing required field: ${field}`);
                }
            }

            const [result] = await db.execute(
                `UPDATE exams 
                SET name = ?, date = ?, time = ?, duration = ?, total_marks = ?, 
                    registration_deadline = ?, fee = ?
                WHERE id = ?`,
                [
                    examData.name,
                    examData.date,
                    examData.time,
                    examData.duration,
                    examData.total_marks,
                    examData.registration_deadline,
                    examData.fee,
                    id
                ]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error updating exam:', error);
            throw error;
        }
    }

    static async delete(id) {
        try {
            // First check if there are any related records
            const [registrations] = await db.execute(
                'SELECT id FROM exam_registrations WHERE exam_id = ?',
                [id]
            );
            
            if (registrations.length > 0) {
                // Get registration IDs for deletion
                const registrationIds = registrations.map(reg => reg.id);
                
                // Check if seat_allocations table exists
                let seatTableExists = false;
                try {
                    const [tableCheck] = await db.execute(
                        "SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'seat_allocations'"
                    );
                    seatTableExists = tableCheck.length > 0;
                } catch (error) {
                    console.log('Error checking seat_allocations table:', error.message);
                }
                
                // Handle seat allocations if table exists
                if (seatTableExists) {
                    try {
                        // Delete seat allocations directly by exam_id to ensure all are removed
                        await db.execute(
                            'DELETE FROM seat_allocations WHERE exam_id = ?',
                            [id]
                        );
                        console.log(`Deleted seat allocations for exam ID ${id}`);
                    } catch (error) {
                        console.error('Error deleting seat allocations:', error);
                        throw new Error(`Failed to delete seat allocations: ${error.message}`);
                    }
                }
                
                // Now handle payments
                try {
                    // Delete payments linked to these registrations
                    await db.execute(
                        'DELETE FROM payments WHERE registration_id IN (?)',
                        [registrationIds]
                    );
                    console.log(`Deleted payments for exam ID ${id}`);
                } catch (error) {
                    console.error('Error deleting payments:', error);
                    // If there's an error deleting payments, we should still continue
                    // as they might not exist
                }
                
                // Now delete registrations
                try {
                    await db.execute(
                        'DELETE FROM exam_registrations WHERE exam_id = ?',
                        [id]
                    );
                    console.log(`Deleted ${registrations.length} registrations for exam ID ${id}`);
                } catch (error) {
                    console.error('Error deleting registrations:', error);
                    throw new Error(`Failed to delete registrations: ${error.message}`);
                }
            }
            
            // Finally delete the exam
            const [result] = await db.execute('DELETE FROM exams WHERE id = ?', [id]);
            console.log(`Exam with ID ${id} deleted successfully`);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error deleting exam:', error);
            throw error;
        }
    }

    static async registerStudent(examId, studentId) {
        try {
            console.log('Registering student for exam:', { examId, studentId });
            const [result] = await db.execute(
                'INSERT INTO exam_registrations (exam_id, student_id, registration_date) VALUES (?, ?, NOW())',
                [examId, studentId]
            );
            console.log('Student registered successfully:', result);
            return result.insertId;
        } catch (error) {
            console.error('Error registering student for exam:', error);
            throw error;
        }
    }

    static async getRegisteredStudents(examId) {
        try {
            console.log('Fetching registered students for exam:', examId);
            const [rows] = await db.execute(
                `SELECT s.* FROM students s 
                JOIN exam_registrations er ON s.id = er.student_id 
                WHERE er.exam_id = ?`,
                [examId]
            );
            console.log('Found registered students:', rows);
            return rows;
        } catch (error) {
            console.error('Error fetching registered students:', error);
            throw error;
        }
    }
}

module.exports = Exam; 