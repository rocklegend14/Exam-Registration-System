const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'exam_registration',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test the connection
pool.getConnection()
    .then(connection => {
        console.log('✅ Successfully connected to the database!');
        connection.release();
    })
    .catch(err => {
        console.error('❌ Error connecting to the database:', err);
        process.exit(1);
    });

// Create tables if they don't exist
const createTables = async () => {
    try {
        const connection = await pool.getConnection();
        
        // Create admins table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS admins (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create exams table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS exams (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                date DATE NOT NULL,
                time TIME NOT NULL,
                duration INT NOT NULL,
                total_marks INT NOT NULL,
                registration_deadline DATE NOT NULL,
                fee DECIMAL(10,2) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

          // Create students table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS students (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                roll_number VARCHAR(255) NOT NULL UNIQUE,
                department VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create exam_registrations table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS exam_registrations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                exam_id INT NOT NULL,
                student_id INT NOT NULL,
                registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (exam_id) REFERENCES exams(id),
                FOREIGN KEY (student_id) REFERENCES students(id)
            )
        `);

        connection.release();
        console.log('✅ Database tables created successfully!');
    } catch (error) {
        console.error('❌ Error creating tables:', error);
        process.exit(1);
    }
};

// Initialize tables
createTables();

module.exports = pool;
