const db = require('./db'); // Database connection

class Student {
    // Create a new student along with user data
    static async create(studentData) {
        try {
            console.log('Creating student with data:', studentData);
            
            // Insert student data into the students table
            const [result] = await db.execute(
                'INSERT INTO students (name, email, password, roll_number, department) VALUES (?, ?, ?, ?, ?)',
                [studentData.name, studentData.email, studentData.password, studentData.roll_number, studentData.department]
            );
            console.log('Student created successfully with ID:', result.insertId);
            
            return result.insertId;
        } catch (error) {
            console.error('Error in Student.create:', error);
            throw error;
        }
    }

    // Find student by email (same as before)
    static async findByEmail(email) {
        try {
            console.log('Finding student by email:', email);
            const [rows] = await db.execute('SELECT * FROM students WHERE email = ?', [email]);
            
            if (rows.length === 0) {
                console.log('No student found with that email.');
                return null;
            }

            console.log('Found student:', rows[0]);
            return rows[0];
        } catch (error) {
            console.error('Error in Student.findByEmail:', error);
            throw error;
        }
    }

    // Find student by ID (same as before)
    static async findById(id) {
        try {
            console.log('Finding student by ID:', id);
            const [rows] = await db.execute('SELECT * FROM students WHERE id = ?', [id]);
            
            if (rows.length === 0) {
                console.log('No student found with that ID.');
                return null;
            }

            console.log('Found student:', rows[0]);
            return rows[0];
        } catch (error) {
            console.error('Error in Student.findById:', error);
            throw error;
        }
    }

    // Update student details (same as before)
    static async update(id, studentData) {
        try {
            console.log('Updating student with ID:', id);
            const result = await db.execute(
                'UPDATE students SET roll_number = ?, department = ? WHERE id = ?',
                [studentData.roll_number, studentData.department, id]
            );

            if (result.affectedRows === 0) {
                console.log('No student found to update with ID:', id);
                return null;
            }

            console.log('Student updated successfully');
            return result;
        } catch (error) {
            console.error('Error in Student.update:', error);
            throw new Error('Error updating student');
        }
    }

    // Delete a student (same as before)
    static async delete(id) {
        try {
            console.log('Deleting student with ID:', id);
            const result = await db.execute('DELETE FROM students WHERE id = ?', [id]);

            if (result.affectedRows === 0) {
                console.log('No student found to delete with ID:', id);
                return null;
            }

            console.log('Student deleted successfully');
            return result;
        } catch (error) {
            console.error('Error in Student.delete:', error);
            throw new Error('Error deleting student');
        }
    }
}

module.exports = Student;
