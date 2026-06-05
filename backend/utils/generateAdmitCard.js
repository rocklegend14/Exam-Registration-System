const { jsPDF } = require('jspdf');
const db = require('../models/db');

async function generateAdmitCard(studentId, examId) {
    try {
        // Fetch student and exam details
        const [student] = await db.execute('SELECT * FROM students WHERE id = ?', [studentId]);
        const [exam] = await db.execute('SELECT * FROM exams WHERE id = ?', [examId]);
        const [registration] = await db.execute(
            'SELECT * FROM exam_registrations WHERE student_id = ? AND exam_id = ?',
            [studentId, examId]
        );

        if (!student || !exam || !registration) {
            throw new Error('Invalid student or exam details');
        }

        // Create PDF
        const doc = new jsPDF();

        // Add header
        doc.setFontSize(20);
        doc.text('EXAM ADMIT CARD', 105, 20, { align: 'center' });

        // Add student details
        doc.setFontSize(12);
        doc.text('Student Details:', 20, 40);
        doc.text(`Name: ${student.name}`, 20, 50);
        doc.text(`Roll Number: ${student.roll_number}`, 20, 60);
        doc.text(`Department: ${student.department}`, 20, 70);

        // Add exam details
        doc.text('Exam Details:', 20, 90);
        doc.text(`Exam Name: ${exam.name}`, 20, 100);
        doc.text(`Date: ${exam.date}`, 20, 110);
        doc.text(`Time: ${exam.time}`, 20, 120);
        doc.text(`Duration: ${exam.duration} minutes`, 20, 130);
        doc.text(`Venue: ${exam.venue || 'To be announced'}`, 20, 140);

        // Add registration details
        doc.text('Registration Details:', 20, 160);
        doc.text(`Registration ID: ${registration.id}`, 20, 170);
        doc.text(`Registration Date: ${registration.registration_date}`, 20, 180);

        // Add instructions
        doc.setFontSize(10);
        doc.text('Important Instructions:', 20, 200);
        doc.text('1. Bring this admit card to the exam center', 20, 210);
        doc.text('2. Bring a valid ID proof', 20, 220);
        doc.text('3. Arrive at least 30 minutes before the exam', 20, 230);

        // Add footer
        doc.setFontSize(8);
        doc.text('This is a computer-generated document. No signature required.', 105, 280, { align: 'center' });

        return doc;
    } catch (error) {
        throw new Error(`Error generating admit card: ${error.message}`);
    }
}

module.exports = generateAdmitCard; 