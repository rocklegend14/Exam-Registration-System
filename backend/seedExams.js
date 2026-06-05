const db = require('./models/db');

// First, check the schema of the exams table
const checkExamsSchema = async () => {
  try {
    const [rows] = await db.execute('DESCRIBE exams');
    console.log('Exam table schema:', rows);
    return rows.map(row => row.Field);
  } catch (error) {
    console.error('Error checking schema:', error);
    return null;
  }
};

const seedExams = async () => {
  try {
    // Check schema first
    const columns = await checkExamsSchema();
    if (!columns) {
      console.error('Unable to determine the columns of the exams table');
      return;
    }

    // Look for column names
    const hasTitle = columns.includes('title');
    const hasName = columns.includes('name');
    const titleField = hasTitle ? 'title' : (hasName ? 'name' : null);

    if (!titleField) {
      console.error('Cannot find title or name column in exams table');
      return;
    }

    console.log(`Using '${titleField}' as the exam title field`);

    const connection = await db.getConnection();
    
    try {
      // Begin transaction
      await connection.beginTransaction();
      
      // Delete existing exams (optional - for testing)
      await connection.execute('DELETE FROM exam_registrations');
      await connection.execute('DELETE FROM exams');
      
      // Insert sample exams
      const exams = [
        {
          title: 'Mathematics Final Exam',
          description: 'End of semester comprehensive exam covering all mathematics topics',
          date: '2023-12-15',
          time: '09:00:00',
          duration: 180,
          total_marks: 100,
          registration_deadline: '2023-12-10',
          fee: 50
        },
        {
          title: 'Computer Science Midterm',
          description: 'Midterm exam covering data structures and algorithms',
          date: '2023-12-20',
          time: '14:00:00',
          duration: 120,
          total_marks: 75,
          registration_deadline: '2023-12-18',
          fee: 40
        },
        {
          title: 'Physics Laboratory Assessment',
          description: 'Practical assessment of physics lab experiments',
          date: '2023-12-22',
          time: '10:00:00',
          duration: 150,
          total_marks: 50,
          registration_deadline: '2023-12-20',
          fee: 30
        }
      ];
      
      for (const exam of exams) {
        // Build the SQL dynamically based on available columns
        const fields = [];
        const placeholders = [];
        const values = [];
        
        // Add all fields that exist in the table
        if (columns.includes(titleField)) {
          fields.push(titleField);
          placeholders.push('?');
          values.push(exam.title);
        }
        
        if (columns.includes('description')) {
          fields.push('description');
          placeholders.push('?');
          values.push(exam.description);
        }
        
        if (columns.includes('date')) {
          fields.push('date');
          placeholders.push('?');
          values.push(exam.date);
        }
        
        if (columns.includes('time')) {
          fields.push('time');
          placeholders.push('?');
          values.push(exam.time);
        }
        
        if (columns.includes('duration')) {
          fields.push('duration');
          placeholders.push('?');
          values.push(exam.duration);
        }
        
        if (columns.includes('total_marks')) {
          fields.push('total_marks');
          placeholders.push('?');
          values.push(exam.total_marks);
        }
        
        if (columns.includes('registration_deadline')) {
          fields.push('registration_deadline');
          placeholders.push('?');
          values.push(exam.registration_deadline);
        }
        
        if (columns.includes('fee')) {
          fields.push('fee');
          placeholders.push('?');
          values.push(exam.fee);
        }
        
        // Construct and execute the query
        const query = `INSERT INTO exams (${fields.join(', ')}) VALUES (${placeholders.join(', ')})`;
        console.log('Executing query:', query);
        
        const [result] = await connection.execute(query, values);
        console.log(`Added exam: ${exam.title} with ID ${result.insertId}`);
      }
      
      // Commit the transaction
      await connection.commit();
      console.log(' Sample exams seeded successfully!');
    } catch (error) {
      // Rollback on error
      await connection.rollback();
      console.error(' Error seeding exams:', error);
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
seedExams();