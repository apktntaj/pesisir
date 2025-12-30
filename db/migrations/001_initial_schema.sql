-- Pesisir Initial Schema
-- Created: December 30, 2025
-- Sprint 0: Initial database setup

-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  credit_balance BIGINT DEFAULT 50000,  -- Rp 50,000 initial balance
  email_verified BOOLEAN DEFAULT FALSE,
  verification_token VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_verification_token ON users(verification_token);

-- Documents table (skeleton for future sprints)
CREATE TABLE documents (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  original_filename VARCHAR(255),
  file_path VARCHAR(255),
  file_size BIGINT,
  document_type VARCHAR(50),  -- BOL, CI, PL, etc.
  status VARCHAR(20) DEFAULT 'uploaded',  -- uploaded, processing, processed, failed
  extracted_data JSONB,  -- Raw extracted data
  confidence_score NUMERIC(3,2),  -- Overall confidence score
  processing_error TEXT,  -- Error message if failed
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_created_at ON documents(created_at);

-- Transactions table (skeleton for payment integration)
CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  transaction_type VARCHAR(20),  -- document_processing, top_up, referral_bonus
  amount BIGINT,  -- Amount in Rp (negative for debit, positive for credit)
  description TEXT,
  reference_id VARCHAR(255),  -- Document ID, Payment ID, etc.
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);

-- Add comment for versioning
COMMENT ON TABLE users IS 'User accounts and credit balance. Created in Sprint 0.';
COMMENT ON TABLE documents IS 'Document processing records. Schema expanded in sprints 2-6.';
COMMENT ON TABLE transactions IS 'Transaction ledger for credit system. Payment integration added in Sprint 5.';
