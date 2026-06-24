-- ========================================
-- SUPABASE TABLE CREATION SCRIPT
-- Phase 1: Blocks 4, 5, 6 Fix
-- ========================================

-- BLOCK 4: PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  amount_paid DECIMAL(15, 2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL DEFAULT 'Bank Transfer',
  bank_name VARCHAR(100),
  receipt_number VARCHAR(100) UNIQUE,
  paid_by_name VARCHAR(150),
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  transaction_reference VARCHAR(100),
  recorded_by VARCHAR(100) DEFAULT 'System',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for payments table
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_student_id ON payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(payment_date);

-- Enable RLS for payments
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payments (permissive - allow access)
DROP POLICY IF EXISTS "Allow read payments" ON payments;
CREATE POLICY "Allow read payments"
  ON payments FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow insert payments" ON payments;
CREATE POLICY "Allow insert payments"
  ON payments FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update payments" ON payments;
CREATE POLICY "Allow update payments"
  ON payments FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Allow delete payments" ON payments;
CREATE POLICY "Allow delete payments"
  ON payments FOR DELETE
  USING (true);

-- ========================================
-- BLOCK 5: USERS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role VARCHAR(50) NOT NULL DEFAULT 'admin',
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- Enable RLS for users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users (permissive)
DROP POLICY IF EXISTS "Allow read users" ON users;
CREATE POLICY "Allow read users"
  ON users FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow insert users" ON users;
CREATE POLICY "Allow insert users"
  ON users FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update users" ON users;
CREATE POLICY "Allow update users"
  ON users FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Allow delete users" ON users;
CREATE POLICY "Allow delete users"
  ON users FOR DELETE
  USING (true);

-- ========================================
-- BLOCK 6: AUDIT_LOGS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100),
  entity_id VARCHAR(255),
  old_values JSONB,
  new_values JSONB,
  description TEXT,
  ip_address VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for audit_logs table
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Enable RLS for audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for audit_logs (permissive - read only for security audit)
DROP POLICY IF EXISTS "Allow read audit logs" ON audit_logs;
CREATE POLICY "Allow read audit logs"
  ON audit_logs FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow insert audit logs" ON audit_logs;
CREATE POLICY "Allow insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (true);

-- Update trigger for audit_logs (on update_at field)
CREATE OR REPLACE FUNCTION update_audit_logs_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.created_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- SUMMARY
-- ========================================
-- Block 4: payments - Payment records with invoice/student tracking
-- Block 5: users - User management for Supabase Auth integration
-- Block 6: audit_logs - Action audit trail for compliance

-- All tables have RLS enabled with permissive policies (allow all)
-- Production: Consider implementing stricter RLS policies based on user roles
