import { supabase } from './supabaseClient'

/**
 * NOTIFICATION SERVICE
 * Handles email and SMS notifications for payment events
 */

// Email configuration using SendGrid or Supabase Edge Functions
const SUPABASE_FUNCTION_URL = 'https://ugcshwgjqubuhbhpxztw.supabase.co/functions/v1'

/**
 * Send payment received notification
 * @param {string} studentName - Student full name
 * @param {string} parentEmail - Parent email address
 * @param {string} parentPhone - Parent phone number (for SMS)
 * @param {number} amount - Payment amount
 * @param {string} invoiceId - Invoice reference
 * @param {string} paymentMethod - How payment was made
 * @param {string} transactionRef - Payment transaction reference
 */
export const sendPaymentReceivedNotification = async (
  studentName,
  parentEmail,
  parentPhone,
  amount,
  invoiceId,
  paymentMethod,
  transactionRef
) => {
  try {
    // Record notification in database
    const { data: notification, error: dbError } = await supabase
      .from('notifications')
      .insert([{
        type: 'payment_received',
        recipient_email: parentEmail,
        recipient_phone: parentPhone,
        student_name: studentName,
        amount,
        invoice_id: invoiceId,
        payment_method: paymentMethod,
        transaction_ref: transactionRef,
        sent_at: new Date().toISOString(),
        status: 'pending'
      }])
      .select()

    if (dbError) throw dbError

    // Send email via Edge Function
    if (parentEmail) {
      const emailPayload = {
        to: parentEmail,
        subject: `Payment Received - ${studentName}`,
        html: generatePaymentReceivedEmail(studentName, amount, invoiceId, paymentMethod, transactionRef)
      }

      await sendViaEdgeFunction('send-email', emailPayload)
    }

    // Send SMS via Edge Function
    if (parentPhone) {
      const smsPayload = {
        to: parentPhone,
        message: `Payment of ₦${amount.toLocaleString()} received for ${studentName}. Ref: ${transactionRef}`
      }

      await sendViaEdgeFunction('send-sms', smsPayload)
    }

    // Update notification status
    await supabase
      .from('notifications')
      .update({ status: 'sent' })
      .eq('id', notification[0]?.id)

    return notification[0]
  } catch (error) {
    console.error('Send payment received notification error:', error)
    throw error
  }
}

/**
 * Send due date approaching reminder
 * @param {string} studentName
 * @param {string} parentEmail
 * @param {string} parentPhone
 * @param {number} amount - Outstanding amount
 * @param {string} dueDate
 * @param {string} invoiceId
 */
export const sendDueDateReminder = async (
  studentName,
  parentEmail,
  parentPhone,
  amount,
  dueDate,
  invoiceId
) => {
  try {
    const { data: notification, error: dbError } = await supabase
      .from('notifications')
      .insert([{
        type: 'due_date_reminder',
        recipient_email: parentEmail,
        recipient_phone: parentPhone,
        student_name: studentName,
        amount,
        invoice_id: invoiceId,
        due_date: dueDate,
        sent_at: new Date().toISOString(),
        status: 'pending'
      }])
      .select()

    if (dbError) throw dbError

    // Send email
    if (parentEmail) {
      const emailPayload = {
        to: parentEmail,
        subject: `Payment Due - ${studentName}`,
        html: generateDueDateReminderEmail(studentName, amount, dueDate, invoiceId)
      }

      await sendViaEdgeFunction('send-email', emailPayload)
    }

    // Send SMS
    if (parentPhone) {
      const daysUntilDue = Math.ceil(
        (new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24)
      )

      const smsPayload = {
        to: parentPhone,
        message: `⚠️ Payment reminder: ₦${amount.toLocaleString()} due in ${daysUntilDue} days for ${studentName}`
      }

      await sendViaEdgeFunction('send-sms', smsPayload)
    }

    // Update notification status
    await supabase
      .from('notifications')
      .update({ status: 'sent' })
      .eq('id', notification[0]?.id)

    return notification[0]
  } catch (error) {
    console.error('Send due date reminder error:', error)
    throw error
  }
}

/**
 * Send payment overdue notice
 * @param {string} studentName
 * @param {string} parentEmail
 * @param {string} parentPhone
 * @param {number} amount
 * @param {string} invoiceId
 * @param {number} daysOverdue
 */
export const sendOverdueNotice = async (
  studentName,
  parentEmail,
  parentPhone,
  amount,
  invoiceId,
  daysOverdue
) => {
  try {
    const { data: notification, error: dbError } = await supabase
      .from('notifications')
      .insert([{
        type: 'payment_overdue',
        recipient_email: parentEmail,
        recipient_phone: parentPhone,
        student_name: studentName,
        amount,
        invoice_id: invoiceId,
        days_overdue: daysOverdue,
        sent_at: new Date().toISOString(),
        status: 'pending'
      }])
      .select()

    if (dbError) throw dbError

    // Send email
    if (parentEmail) {
      const emailPayload = {
        to: parentEmail,
        subject: `⚠️ URGENT: Overdue Payment - ${studentName}`,
        html: generateOverdueNoticeEmail(studentName, amount, daysOverdue, invoiceId)
      }

      await sendViaEdgeFunction('send-email', emailPayload)
    }

    // Send SMS
    if (parentPhone) {
      const smsPayload = {
        to: parentPhone,
        message: `⚠️ URGENT: Payment of ₦${amount.toLocaleString()} is ${daysOverdue} days overdue for ${studentName}. Please pay immediately.`
      }

      await sendViaEdgeFunction('send-sms', smsPayload)
    }

    // Update notification status
    await supabase
      .from('notifications')
      .update({ status: 'sent' })
      .eq('id', notification[0]?.id)

    return notification[0]
  } catch (error) {
    console.error('Send overdue notice error:', error)
    throw error
  }
}

/**
 * Send scheduled report to director
 * @param {string} directorEmail
 * @param {string} reportType - 'daily', 'weekly', 'monthly'
 * @param {object} reportData - Report statistics and data
 */
export const sendScheduledReport = async (directorEmail, reportType, reportData) => {
  try {
    const { data: notification, error: dbError } = await supabase
      .from('notifications')
      .insert([{
        type: 'scheduled_report',
        recipient_email: directorEmail,
        report_type: reportType,
        sent_at: new Date().toISOString(),
        status: 'pending'
      }])
      .select()

    if (dbError) throw dbError

    // Generate and send report
    const emailPayload = {
      to: directorEmail,
      subject: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Fee Management Report`,
      html: generateReportEmail(reportType, reportData),
      attachment: true // Will generate PDF attachment via Edge Function
    }

    await sendViaEdgeFunction('send-report', emailPayload)

    // Update notification status
    await supabase
      .from('notifications')
      .update({ status: 'sent' })
      .eq('id', notification[0]?.id)

    return notification[0]
  } catch (error) {
    console.error('Send scheduled report error:', error)
    throw error
  }
}

/**
 * Send via Supabase Edge Function
 */
const sendViaEdgeFunction = async (functionName, payload) => {
  try {
    const { data: { session } } = await supabase.auth.getSession()

    const response = await fetch(`${SUPABASE_FUNCTION_URL}/${functionName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token || ''}`
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      throw new Error(`Edge Function error: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error(`Error sending via ${functionName}:`, error)
    // Don't throw - notifications are optional
    return null
  }
}

/**
 * Email template generators
 */
const generatePaymentReceivedEmail = (studentName, amount, invoiceId, paymentMethod, transactionRef) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; background: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; }
    .header { color: #2563eb; border-bottom: 3px solid #2563eb; padding-bottom: 10px; }
    .content { margin: 20px 0; line-height: 1.6; }
    .amount { font-size: 28px; font-weight: bold; color: #10b981; margin: 15px 0; }
    .details { background: #f9fafb; padding: 15px; border-radius: 5px; margin: 15px 0; }
    .footer { color: #6b7280; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Payment Received ✓</h1>
    </div>
    <div class="content">
      <p>Dear Parent/Guardian,</p>
      <p>Thank you for your payment. We have successfully received your payment for <strong>${studentName}</strong>.</p>
      
      <div class="amount">₦${amount.toLocaleString()}</div>
      
      <div class="details">
        <p><strong>Invoice:</strong> ${invoiceId}</p>
        <p><strong>Payment Method:</strong> ${paymentMethod}</p>
        <p><strong>Transaction Reference:</strong> ${transactionRef}</p>
        <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
      </div>
      
      <p>Your account has been updated. For any inquiries, please contact the school office.</p>
      
      <p>Best regards,<br>Albayyan International School</p>
    </div>
    <div class="footer">
      <p>This is an automated message. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
`

const generateDueDateReminderEmail = (studentName, amount, dueDate, invoiceId) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; background: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; }
    .header { color: #f59e0b; border-bottom: 3px solid #f59e0b; padding-bottom: 10px; }
    .content { margin: 20px 0; line-height: 1.6; }
    .amount { font-size: 28px; font-weight: bold; color: #f59e0b; margin: 15px 0; }
    .details { background: #fffbeb; padding: 15px; border-radius: 5px; margin: 15px 0; }
    .footer { color: #6b7280; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Payment Due Reminder</h1>
    </div>
    <div class="content">
      <p>Dear Parent/Guardian,</p>
      <p>This is a friendly reminder that a payment is due for <strong>${studentName}</strong>.</p>
      
      <div class="amount">₦${amount.toLocaleString()}</div>
      
      <div class="details">
        <p><strong>Invoice:</strong> ${invoiceId}</p>
        <p><strong>Due Date:</strong> ${new Date(dueDate).toLocaleDateString()}</p>
      </div>
      
      <p>Please ensure payment is made by the due date to avoid any delays in your student's academic progress.</p>
      <p>You can pay online through our portal or visit the school office.</p>
      
      <p>Best regards,<br>Albayyan International School</p>
    </div>
    <div class="footer">
      <p>This is an automated message. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
`

const generateOverdueNoticeEmail = (studentName, amount, daysOverdue, invoiceId) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; background: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; }
    .header { color: #ef4444; border-bottom: 3px solid #ef4444; padding-bottom: 10px; }
    .content { margin: 20px 0; line-height: 1.6; }
    .amount { font-size: 28px; font-weight: bold; color: #ef4444; margin: 15px 0; }
    .details { background: #fee2e2; padding: 15px; border-radius: 5px; margin: 15px 0; }
    .footer { color: #6b7280; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚠️ URGENT: Payment Overdue</h1>
    </div>
    <div class="content">
      <p>Dear Parent/Guardian,</p>
      <p>Your payment for <strong>${studentName}</strong> is now <strong>${daysOverdue} days overdue</strong>.</p>
      
      <div class="amount">₦${amount.toLocaleString()}</div>
      
      <div class="details">
        <p><strong>Invoice:</strong> ${invoiceId}</p>
        <p><strong>Days Overdue:</strong> ${daysOverdue}</p>
      </div>
      
      <p><strong>IMMEDIATE ACTION REQUIRED:</strong></p>
      <p>Please make payment immediately to avoid further complications with your student's enrollment and academic activities.</p>
      
      <p>If you have already made this payment, please disregard this notice and contact the school office.</p>
      
      <p>Best regards,<br>Albayyan International School</p>
    </div>
    <div class="footer">
      <p>This is an automated message. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
`

const generateReportEmail = (reportType, reportData) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; background: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; }
    .header { color: #2563eb; border-bottom: 3px solid #2563eb; padding-bottom: 10px; }
    .content { margin: 20px 0; line-height: 1.6; }
    .stats { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
    .stat-item { background: #f9fafb; padding: 15px; border-radius: 5px; }
    .stat-value { font-size: 24px; font-weight: bold; color: #2563eb; }
    .stat-label { font-size: 12px; color: #6b7280; }
    .footer { color: #6b7280; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Fee Management Report</h1>
    </div>
    <div class="content">
      <p>Dear Director,</p>
      <p>Please find below the ${reportType} fee management report.</p>
      
      <div class="stats">
        <div class="stat-item">
          <div class="stat-label">Total Students</div>
          <div class="stat-value">${reportData.totalStudents || 0}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">Total Invoices</div>
          <div class="stat-value">${reportData.totalInvoices || 0}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">Paid</div>
          <div class="stat-value">₦${(reportData.totalPaid || 0).toLocaleString()}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">Outstanding</div>
          <div class="stat-value">₦${(reportData.totalOutstanding || 0).toLocaleString()}</div>
        </div>
      </div>
      
      <p>The detailed PDF report is attached to this email.</p>
      
      <p>Best regards,<br>Fee Management System</p>
    </div>
    <div class="footer">
      <p>This is an automated message. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
`

export default {
  sendPaymentReceivedNotification,
  sendDueDateReminder,
  sendOverdueNotice,
  sendScheduledReport
}
