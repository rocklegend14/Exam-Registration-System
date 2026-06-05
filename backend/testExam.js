const mysql = require('mysql2/promise');
require('dotenv').config();

async function insertTestExam() {
    try {
        // Create connection
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        console.log('Connected to database');

        // Insert test exam
        const [result] = await connection.execute(
            `INSERT INTO exams 
            (name, date, time, duration, total_marks, registration_deadline, fee) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                'Test Exam 1',
                '2024-03-20',
                '09:00:00',
                120,
                100,
                '2024-03-15',
                500.00
            ]
        );

        console.log('Test exam inserted successfully with ID:', result.insertId);

        // Verify the insertion
        const [rows] = await connection.execute('SELECT * FROM exams');
        console.log('Current exams in database:', rows);

        await connection.end();
    } catch (error) {
        console.error('Error:', error);
    }
}

insertTestExam(); 