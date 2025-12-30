-- Sprint 1: Authentication System Schema
-- Date: December 31, 2025
-- Purpose: Add authentication and user management tables/columns

-- Create user role enum type
CREATE TYPE user_role AS ENUM ('admin', 'user');

-- Add authentication columns to users table
ALTER TABLE users 
  ADD COLUMN email_verified BOOLEAN DEFAULT false,
  ADD COLUMN verification_token VARCHAR(500),
  ADD COLUMN verification_token_expires_at TIMESTAMP,
  ADD COLUMN reset_token VARCHAR(500),
  ADD COLUMN reset_token_expires_at TIMESTAMP,
  ADD COLUMN last_login TIMESTAMP,
  ADD COLUMN role user_role DEFAULT 'user',
  ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Add indexes for auth performance
CREATE INDEX idx_users_email_verified ON users(email, email_verified);
CREATE INDEX idx_users_verification_token ON users(verification_token) WHERE verification_token IS NOT NULL;
CREATE INDEX idx_users_reset_token ON users(reset_token) WHERE reset_token IS NOT NULL;
CREATE INDEX idx_users_role ON users(role);

-- Create sessions table for tracking active sessions (optional but useful)
CREATE TABLE sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(500) NOT NULL UNIQUE,
  token_type VARCHAR(50) DEFAULT 'jwt',
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  revoked_at TIMESTAMP,
  revoked_reason VARCHAR(255)
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

-- Create audit log table for security tracking
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100),
  resource_id INTEGER,
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  status VARCHAR(50),
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Add comment to document the changes
COMMENT ON COLUMN users.email_verified IS 'Flag to indicate if user email has been verified';
COMMENT ON COLUMN users.verification_token IS 'Token sent via email for email verification';
COMMENT ON COLUMN users.reset_token IS 'Token sent via email for password reset';
COMMENT ON COLUMN users.last_login IS 'Timestamp of last successful login';
COMMENT ON COLUMN users.role IS 'User role for RBAC (admin, user)';
COMMENT ON TABLE sessions IS 'Active JWT sessions for revocation tracking';
COMMENT ON TABLE audit_logs IS 'Security audit trail for all user actions';
