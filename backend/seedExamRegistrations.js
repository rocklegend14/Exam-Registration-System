const db = require('./models/db');

const seedExamRegistrations = async () => {
    try {
        const connection = await db.getConnection();

        // First, get existing students
        const [students] = await connection.execute('SELECT id FROM students');
        
        if (students.length === 0) {
            console.log(' No students found in the database. Please add students first.');
            process.exit(1);
        }

        // Get existing exams
        const [exams] = await connection.execute('SELECT id FROM exams');
        
        if (exams.length === 0) {
            console.log(' No exams found in the database. Please add exams first.');
            process.exit(1);
        }

        // Create sample registrations
        for (const student of students) {
            // Register each student for 1-3 random exams
            const numExams = Math.floor(Math.random() * 3) + 1;
            const shuffledExams = exams.sort(() => 0.5 - Math.random());
            
            for (let i = 0; i < Math.min(numExams, shuffledExams.length); i++) {
                try {
                    await connection.execute(
                        `INSERT INTO exam_registrations 
                        (student_id, exam_id, registration_date) 
                        VALUES (?, ?, NOW())`,
                        [student.id, shuffledExams[i].id]
                    );
                    console.log(` Created registration for student ${student.id} in exam ${shuffledExams[i].id}`);
                } catch (error) {
                    // Skip if registration already exists
                    if (error.code === 'ER_DUP_ENTRY') {
                        console.log(` Registration already exists for student ${student.id} in exam ${shuffledExams[i].id}`);
                        continue;
                    }
                    throw error;
                }
            }
        }

        connection.release();
        console.log(' Sample exam registrations seeded successfully!');
    } catch (error) {
        console.error(' Error seeding exam registrations:', error);
    } finally {
        process.exit();
    }
};

seedExamRegistrations(); 