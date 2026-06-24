-- Notifications table for tracking all notifications sent
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL, -- 'payment_received', 'due_date_reminder', 'payment_overdue', 'scheduled_report'
  recipient_email VARCHAR(255),
  recipient_phone VARCHAR(20),
  student_name VARCHAR(255),
  amount DECIMAL(12, 2),
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  payment_method VARCHAR(100),
  transaction_ref VARCHAR(255),
  due_date DATE,
  report_type VARCHAR(50), -- 'daily', 'weekly', 'monthly'
  days_overdue INTEGER,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'sent', 'failed'
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Permissive policy for admins to view all notifications
CREATE POLICY "Allow users to view notifications" ON notifications
  FOR SELECT USING (true);

-- Allow authenticated users to insert notifications
CREATE POLICY "Allow users to create notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- Allow users to update notification status
CREATE POLICY "Allow users to update notifications" ON notifications
  FOR UPDATE USING (true);

-- Create index for faster queries
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_notifications_invoice_id ON notifications(invoice_id);

-- Add notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  email_payment_received BOOLEAN DEFAULT true,
  email_due_date_reminder BOOLEAN DEFAULT true,
  email_payment_overdue BOOLEAN DEFAULT true,
  sms_payment_received BOOLEAN DEFAULT false,
  sms_due_date_reminder BOOLEAN DEFAULT false,
  sms_payment_overdue BOOLEAN DEFAULT true,
  daily_report BOOLEAN DEFAULT false,
  weekly_report BOOLEAN DEFAULT true,
  monthly_report BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow users to manage own preferences" ON notification_preferences
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Allow users to view preferences" ON notification_preferences
  FOR SELECT USING (true);
