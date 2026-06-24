import React, { useState, useEffect } from 'react';
import './StudentPortal.css';
import SchoolHeader from './SchoolHeader';
import { supabase } from './utils/supabaseClient';
import { generateInvoicePDF, generatePaymentReceiptPDF } from './utils/pdfService';

const StudentPortal = ({ student, onLogout }) => {
  const [activeTab, setActiveTab] = useState('invoices');
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [stats, setStats] = useState({
    totalAmount: 0,
    totalPaid: 0,
    outstandingBalance: 0,
    paymentPercentage: 0
  });

  useEffect(() => {
    loadPortalData();
  }, [student?.id]);

  const loadPortalData = async () => {
    try {
      setLoading(true);

      // Fetch invoices for this student
      const { data: invoicesData, error: invoicesError } = await supabase
        .from('invoices')
        .select(`
          id,
          student_id,
          term:terms(id, name),
          amount,
          status,
          due_date,
          created_at
        `)
        .eq('student_id', student?.id)
        .order('created_at', { ascending: false });

      if (invoicesError) throw invoicesError;

      setInvoices(invoicesData || []);

      // Fetch payments for this student
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select(`
          id,
          invoice_id,
          amount,
          payment_method,
          bank_name,
          transaction_ref,
          payment_date
        `)
        .eq('student_id', student?.id)
        .order('payment_date', { ascending: false });

      if (paymentsError) throw paymentsError;

      setPayments(paymentsData || []);

      // Calculate stats
      const totalAmount = (invoicesData || []).reduce((sum, inv) => sum + inv.amount, 0);
      const totalPaid = (paymentsData || []).reduce((sum, pay) => sum + pay.amount, 0);
      const outstandingBalance = totalAmount - totalPaid;

      setStats({
        totalAmount,
        totalPaid,
        outstandingBalance,
        paymentPercentage: totalAmount > 0 ? Math.round((totalPaid / totalAmount) * 100) : 0
      });

      setLoading(false);
    } catch (error) {
      console.error('Error loading portal data:', error);
      showSuccess('❌ Error loading data');
      setLoading(false);
    }
  };

  const showSuccess = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const getInvoiceStatusBadge = (status) => {
    const statusMap = {
      paid: { bg: '#d1fae5', color: '#065f46', text: '✓ Paid' },
      partial: { bg: '#fed7aa', color: '#9a3412', text: '⚠ Partial' },
      unpaid: { bg: '#fef3c7', color: '#92400e', text: '⏳ Unpaid' }
    };
    return statusMap[status] || statusMap.unpaid;
  };

  return (
    <div className="student-portal">
      {successMessage && <div className="success-toast">{successMessage}</div>}

      <SchoolHeader />

      <div className="portal-header">
        <div className="portal-welcome">
          <h1>👨‍🎓 Welcome, {student?.firstName || 'Student'}</h1>
          <p>Track your invoices and payment history</p>
        </div>
        <button className="logout-btn" onClick={onLogout}>
          🚪 Logout
        </button>
      </div>

      {/* Stats Overview */}
      <div className="portal-content">
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Billed</h3>
            <div className="stat-number">₦{stats.totalAmount.toLocaleString()}</div>
            <small>All invoices</small>
          </div>
          <div className="stat-card">
            <h3>Amount Paid</h3>
            <div className="stat-number">₦{stats.totalPaid.toLocaleString()}</div>
            <small>Confirmed payments</small>
          </div>
          <div className="stat-card">
            <h3>Balance Due</h3>
            <div className="stat-number">₦{stats.outstandingBalance.toLocaleString()}</div>
            <small>Outstanding</small>
          </div>
          <div className="stat-card">
            <h3>Payment Status</h3>
            <div className="stat-number">{stats.paymentPercentage}%</div>
            <small>Paid</small>
          </div>
        </div>

        {/* Tabs */}
        <div className="portal-tabs">
          <button
            className={`tab-btn ${activeTab === 'invoices' ? 'active' : ''}`}
            onClick={() => setActiveTab('invoices')}
          >
            📄 Invoices ({invoices.length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'payments' ? 'active' : ''}`}
            onClick={() => setActiveTab('payments')}
          >
            ✓ Payment History ({payments.length})
          </button>
        </div>

        {/* Invoices Tab */}
        {activeTab === 'invoices' && (
          <div className="tab-content">
            <h2>📄 Your Invoices</h2>

            {loading ? (
              <p>Loading invoices...</p>
            ) : invoices.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#666', padding: '30px' }}>
                No invoices found. Contact your school office.
              </p>
            ) : (
              <div className="invoices-list">
                {invoices.map(invoice => {
                  const statusBadge = getInvoiceStatusBadge(invoice.status);
                  return (
                    <div key={invoice.id} className="invoice-card">
                      <div className="invoice-header">
                        <div className="invoice-info">
                          <h3>Invoice #{invoice.id.slice(0, 8)}</h3>
                          <p className="term-name">{invoice.term?.name || 'General'}</p>
                        </div>
                        <div
                          className="status-badge"
                          style={{
                            background: statusBadge.bg,
                            color: statusBadge.color
                          }}
                        >
                          {statusBadge.text}
                        </div>
                      </div>

                      <div className="invoice-details">
                        <div className="detail-row">
                          <span>Amount Due:</span>
                          <strong>₦{invoice.amount.toLocaleString()}</strong>
                        </div>
                        <div className="detail-row">
                          <span>Due Date:</span>
                          <strong>{new Date(invoice.due_date).toLocaleDateString()}</strong>
                        </div>
                        <div className="detail-row">
                          <span>Date Issued:</span>
                          <strong>{new Date(invoice.created_at).toLocaleDateString()}</strong>
                        </div>
                      </div>

                      <div className="invoice-actions">
                        <button
                          className="action-btn primary"
                          onClick={() => generateInvoicePDF(invoice, student, {})}
                        >
                          📥 Download PDF
                        </button>
                        {invoice.status !== 'paid' && (
                          <button className="action-btn secondary">
                            💳 Make Payment
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === 'payments' && (
          <div className="tab-content">
            <h2>✓ Payment History</h2>

            {loading ? (
              <p>Loading payments...</p>
            ) : payments.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#666', padding: '30px' }}>
                No payments recorded yet.
              </p>
            ) : (
              <div className="payments-table">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Method</th>
                      <th>Bank</th>
                      <th>Transaction Ref</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map(payment => (
                      <tr key={payment.id}>
                        <td>{new Date(payment.payment_date).toLocaleDateString()}</td>
                        <td>
                          <strong>₦{payment.amount.toLocaleString()}</strong>
                        </td>
                        <td>{payment.payment_method}</td>
                        <td>{payment.bank_name || '—'}</td>
                        <td className="transaction-ref">
                          {payment.transaction_ref || '—'}
                        </td>
                        <td>
                          <button
                            className="action-btn small"
                            onClick={() => {
                              const invoice = invoices.find(
                                inv => inv.id === payment.invoice_id
                              );
                              if (invoice) {
                                generatePaymentReceiptPDF(payment, student, invoice);
                              }
                            }}
                          >
                            📄
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentPortal;
