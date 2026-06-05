const db = require('./models/db');

const seedPayments = async () => {
  try {
    const connection = await db.getConnection();
    
    try {
      // Begin transaction
      await connection.beginTransaction();
      
      // First, get all exam registrations that don't have payments
      const [registrations] = await connection.execute(`
        SELECT er.id, er.student_id, er.exam_id, e.fee 
        FROM exam_registrations er
        JOIN exams e ON er.exam_id = e.id
        LEFT JOIN payments p ON er.id = p.registration_id
        WHERE p.id IS NULL
      `);
      
      console.log(`Found ${registrations.length} registrations without payments`);
      
      if (registrations.length === 0) {
        console.log('No registrations found without payments. Creating a sample registration and payment...');
        
        // Check if we have any students
        const [students] = await connection.execute('SELECT id FROM students LIMIT 1');
        if (students.length === 0) {
          console.log('No students found. Creating a test student...');
          await connection.execute(`
            INSERT INTO students (name, email, password, roll_number, department) 
            VALUES ('Test Student', 'test@example.com', 'password123', 'TS001', 'Computer Science')
          `);
          console.log('Test student created');
        }
        
        // Check if we have any exams
        const [exams] = await connection.execute('SELECT id FROM exams LIMIT 1');
        if (exams.length === 0) {
          console.log('No exams found. Please run seedExams.js first');
          return;
        }
        
        // Get student ID and exam ID
        const [student] = await connection.execute('SELECT id FROM students LIMIT 1');
        const [exam] = await connection.execute('SELECT id, fee FROM exams LIMIT 1');
        
        const studentId = student[0].id;
        const examId = exam[0].id;
        const fee = exam[0].fee;
        
        // Create a new registration
        const [regResult] = await connection.execute(`
          INSERT INTO exam_registrations (student_id, exam_id, registration_date) 
          VALUES (?, ?, NOW())
        `, [studentId, examId]);
        
        const registrationId = regResult.insertId;
        console.log(`Created test registration with ID ${registrationId}`);
        
        // Create payment for this registration
        const [paymentResult] = await connection.execute(`
          INSERT INTO payments (registration_id, amount, payment_date, payment_method, transaction_id, status) 
          VALUES (?, ?, NOW(), 'Credit Card', CONCAT('TXN', FLOOR(RAND() * 1000000)), 'completed')
        `, [registrationId, fee]);
        
        console.log(`Created test payment with ID ${paymentResult.insertId}`);
      } else {
        // Add payments for each registration
        for (const reg of registrations) {
          const [result] = await connection.execute(`
            INSERT INTO payments (registration_id, amount, payment_date, payment_method, transaction_id, status) 
            VALUES (?, ?, NOW(), 'Credit Card', CONCAT('TXN', FLOOR(RAND() * 1000000)), 'completed')
          `, [reg.id, reg.fee]);
          
          console.log(`Added payment for registration ID ${reg.id} with payment ID ${result.insertId}`);
        }
      }
      
      // Commit the transaction
      await connection.commit();
      console.log(' Payment data seeded successfully!');
    } catch (error) {
      // Rollback on error
      await connection.rollback();
      console.error(' Error seeding payments:', error);
    } finally {
      // Release the connection
      connection.release();
    }
  } catch (error) {
    console.error(' Database connection error:', error);
  } finally {
    process.exit();
  }
};

// Run the seed function
seedPayments(); 