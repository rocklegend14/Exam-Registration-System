const fs = require('fs');
const path = require('path');
const db = require('./models/db');

const runPaymentsMigration = async () => {
  try {
    console.log('Starting payments migration...');
    
    // First check if exam_registrations table has the payment_status column
    const [registrationsColumns] = await db.execute('DESCRIBE exam_registrations');
    const hasPaymentStatus = registrationsColumns.some(col => col.Field === 'payment_status');
    
    if (!hasPaymentStatus) {
      console.log('Adding payment_status column to exam_registrations table...');
      await db.execute(`ALTER TABLE exam_registrations 
                         ADD COLUMN payment_status VARCHAR(20) DEFAULT 'unpaid' AFTER registration_date`);
      console.log('Payment status column added successfully!');
    } else {
      console.log('Payment status column already exists.');
    }
    
    // Drop the existing payments table if it exists
    console.log('Dropping existing payments table if it exists...');
    await db.execute('DROP TABLE IF EXISTS payments');
    console.log('Table dropped or did not exist.');
    
    // Create the payments table with the correct structure
    console.log('Creating payments table with correct structure...');
    await db.execute(`
      CREATE TABLE payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        registration_id INT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        payment_method VARCHAR(50) NOT NULL,
        card_details TEXT,
        transaction_id VARCHAR(100) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        FOREIGN KEY (registration_id) REFERENCES exam_registrations(id) ON DELETE CASCADE
      )
    `);
    console.log('Payments table created successfully!');
    
    // Add indexes
    console.log('Adding indexes to payments table...');
    await db.execute('CREATE INDEX idx_payments_registration ON payments(registration_id)');
    await db.execute('CREATE INDEX idx_payments_transaction ON payments(transaction_id)');
    await db.execute('CREATE INDEX idx_payments_status ON payments(status)');
    console.log('Indexes added successfully!');
    
    // Drop existing trigger and create a new one
    console.log('Creating payment trigger...');
    try {
      await db.execute('DROP TRIGGER IF EXISTS after_payment_insert');
      await db.execute(`
        CREATE TRIGGER after_payment_insert
        AFTER INSERT ON payments
        FOR EACH ROW
        BEGIN
          UPDATE exam_registrations 
          SET payment_status = 'paid'
          WHERE id = NEW.registration_id;
        END
      `);
      console.log('Trigger created successfully!');
    } catch (error) {
      console.error('Error creating trigger:', error);
    }
    
    console.log(' Payments migration completed successfully!');
  } catch (error) {
    console.error(' Migration error:', error);
  } finally {
    console.log('Migration process finished.');
  }
};

// Run the migration
runPaymentsMigration()
  .then(() => {
    console.log('Migration script execution complete.');
  })
  .catch(err => {
    console.error('Fatal error in migration script:', err);
  }); 