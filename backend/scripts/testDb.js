const db = require('../models/db');

async function testDatabase() {
    try {
        // Test connection
        const connection = await db.getConnection();
        console.log('✅ Database connection successful!');
        
        // Check if admins table exists and has records
        const [adminRows] = await connection.execute('SELECT * FROM admins');
        console.log('Admins table records:', adminRows);
        
        // Check table structure
        const [tableInfo] = await connection.execute('DESCRIBE admins');
        console.log('Admins table structure:', tableInfo);
        
        connection.release();
    } catch (error) {
        console.error('❌ Database test failed:', error);
    }
}

testDatabase(); 