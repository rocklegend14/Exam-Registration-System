-- Create payments table if it doesn't exist
CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  registration_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  payment_method VARCHAR(50) NOT NULL,
  card_details TEXT,
  transaction_id VARCHAR(100) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  FOREIGN KEY (registration_id) REFERENCES exam_registrations(id) ON DELETE CASCADE
);

-- Add indexes for performance
-- First, check if indexes exist and create them if they don't
SELECT COUNT(1) INTO @idx_exists FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'payments' AND index_name = 'idx_payments_registration';
IF @idx_exists = 0 THEN
  CREATE INDEX idx_payments_registration ON payments(registration_id);
END IF;

SELECT COUNT(1) INTO @idx_exists FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'payments' AND index_name = 'idx_payments_transaction';
IF @idx_exists = 0 THEN
  CREATE INDEX idx_payments_transaction ON payments(transaction_id);
END IF;

SELECT COUNT(1) INTO @idx_exists FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'payments' AND index_name = 'idx_payments_status';
IF @idx_exists = 0 THEN
  CREATE INDEX idx_payments_status ON payments(status);
END IF;

-- Add a trigger to automatically update the payment status in the exam_registrations table
DELIMITER //
DROP TRIGGER IF EXISTS after_payment_insert //
CREATE TRIGGER after_payment_insert
AFTER INSERT ON payments
FOR EACH ROW
BEGIN
  -- Update the registration to mark it as paid
  UPDATE exam_registrations 
  SET payment_status = 'paid'
  WHERE id = NEW.registration_id;
END//
DELIMITER ; 