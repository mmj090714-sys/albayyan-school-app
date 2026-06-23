import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SchoolHeader from './SchoolHeader';
import './DirectorDashboard.css';

const DirectorDashboard = ({ onLogout }) => {
  const [students, setStudents] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [summary, setSummary] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const directorToken = localStorage.getItem('directorToken');

  // Load Dashboard Data
  useEffect(() => {
    loadDashboard();
    // Refresh notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${directorToken}` };

      const [summaryRes, notificationsRes, studentsRes, invoicesRes, paymentsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/director/summary', { headers }),
        axios.get('http://localhost:5000/api/director/notifications', { headers }),
        axios.get('http://localhost:5000/api/director/students', { headers }),
        axios.get('http://localhost:5000/api/director/invoices', { headers }),
        axios.get('http://localhost:5000/api/director/payments', { headers })
      ]);

      setSummary(summaryRes.data);
      setNotifications(notificationsRes.data);
      setStudents(studentsRes.data);
      setInvoices(invoicesRes.data);
      setPayments(paymentsRes.data);
      setError(null);
    } catch (err) {
      console.error('Error loading dashboard:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadNotifications = async () => {
    try {
      const headers = { Authorization: `Bearer ${directorToken}` };
      const res = await axios.get('http://localhost:5000/api/director/notifications', { headers });
      setNotifications(res.data);
    } catch (err) {
      console.error('Error loading notifications:', err);
    }
  };

  const handleLogoutClick = () => {
    if (onLogout) onLogout();
  };

  if (loading) {
    return <div className="director-loading">Loading Director Portal...</div>;
  }

  return (
    <div className="director-container">
      <SchoolHeader />
      
      <div className="director-header-section">
        <div></div>
        <button 
          onClick={handleLogoutClick}
          className="director-logout-btn"
        >
          🚪 Logout
        </button>
      </div>

      <div className="director-content-wrapper">
        {error && <div className="error-alert">⚠️ {error}</div>}

        {/* TAB NAVIGATION */}
        <div className="director-tabs">
          {[
            { key: 'dashboard', label: '📊 Dashboard' },
            { key: 'students', label: '👥 Students' },
            { key: 'invoices', label: '📄 Invoices' },
            { key: 'payments', label: '💳 Payments' },
            { key: 'notifications', label: '🔔 Notifications' }
          ].map(tab => (
            <button
              key={tab.key}
              className={`director-tab-btn ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && summary && (
          <div className="director-tab-content">
            <h2>📊 Director Dashboard Overview</h2>
            <div className="director-stats-grid">
              {[
                { label: 'Total Students', value: summary.totalStudents, icon: '👥' },
                { label: 'Primary Students', value: summary.primaryStudents || 0, icon: '🏫' },
                { label: 'Secondary Students', value: summary.secondaryStudents || 0, icon: '🎓' },
                { label: 'Total Boarders', value: summary.totalBoarders || 0, icon: '🛏️' },
                { label: 'School Bus Users', value: summary.totalBusUsers || 0, icon: '🚌' },
                { label: 'Total Invoices', value: summary.totalInvoices, icon: '📄' },
                { label: 'Total Payments', value: summary.totalPayments, icon: '💳' },
                { label: 'Recent Payments (24h)', value: summary.recentPayments, icon: '📦' },
                { label: 'Total Expected', value: `₦${summary.totalExpected.toLocaleString()}`, icon: '💵' },
                { label: 'Total Collected', value: `₦${summary.totalCollected.toLocaleString()}`, icon: '💰' },
                { label: 'Outstanding Balance', value: `₦${summary.totalOutstanding.toLocaleString()}`, icon: '🔴' },
                { label: 'Collection Rate', value: `${summary.collectionRate}%`, icon: '📊' }
              ].map((stat, idx) => (
                <div key={idx} className="director-stat-card">
                  <div className="director-stat-icon">{stat.icon}</div>
                  <div className="director-stat-label">{stat.label}</div>
                  <div className="director-stat-number">{stat.value}</div>
                </div>
              ))}
            </div>

            {/* Recent Payments */}
            <h3 style={{ marginTop: '30px' }}>🔔 Latest Payments (Last 7 Days)</h3>
            <table className="director-data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Student</th>
                  <th>Amount</th>
                  <th>Payment Method</th>
                </tr>
              </thead>
              <tbody>
                {notifications.length > 0 ? (
                  notifications.map((payment, idx) => (
                    <tr key={idx}>
                      <td>{new Date(payment.createdAt).toLocaleDateString()} {new Date(payment.createdAt).toLocaleTimeString()}</td>
                      <td>{payment.invoice.student.firstName} {payment.invoice.student.lastName}</td>
                      <td style={{ fontWeight: 'bold', color: '#10b981' }}>₦{payment.amountPaid.toLocaleString()}</td>
                      <td>{payment.paymentMethod}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>No recent payments</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* STUDENTS TAB */}
        {activeTab === 'students' && (
          <div className="director-tab-content">
            <h2>👥 Registered Students</h2>
            <table className="director-data-table">
              <thead>
                <tr>
                  <th>Admission #</th>
                  <th>Name</th>
                  <th>School</th>
                  <th>Class</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Boarding</th>
                  <th>Bus</th>
                  <th>Invoices</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 'bold' }}>{student.admissionNumber}</td>
                    <td>{student.firstName} {student.lastName}</td>
                    <td><strong>{student.school || 'Secondary'}</strong></td>
                    <td>{student.classLevel}</td>
                    <td>{student.parentPhoneNumber || '—'}</td>
                    <td>{student.isNewStudent ? '🆕 New' : '↩️ Returning'}</td>
                    <td>{student.boardingStatus ? '🛏️ Yes' : '❌ No'}</td>
                    <td>{student.takesSchoolBus ? '🚌 Yes' : '❌ No'}</td>
                    <td>
                      <span style={{
                        backgroundColor: student.invoices.length > 0 ? '#f59e0b' : '#10b981',
                        color: 'white',
                        padding: '5px 10px',
                        borderRadius: '6px',
                        fontWeight: 'bold'
                      }}>
                        {student.invoices.length}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* INVOICES TAB */}
        {activeTab === 'invoices' && (
          <div>
            <h2>📄 All Invoices</h2>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              backgroundColor: 'white',
              borderRadius: '10px',
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#34495e', color: 'white' }}>
                  <th style={{ padding: '15px', textAlign: 'left' }}>Student</th>
                  <th style={{ padding: '15px', textAlign: 'left' }}>Term</th>
                  <th style={{ padding: '15px', textAlign: 'left' }}>Expected</th>
                  <th style={{ padding: '15px', textAlign: 'left' }}>Paid</th>
                  <th style={{ padding: '15px', textAlign: 'left' }}>Balance</th>
                  <th style={{ padding: '15px', textAlign: 'left' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice, idx) => {
                  const paidPercentage = invoice.totalAmount > 0 ? (invoice.amountPaid / invoice.totalAmount * 100) : 0;
                  const statusColor = paidPercentage === 100 ? '#2ecc71' : paidPercentage > 50 ? '#f39c12' : '#e74c3c';
                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid #ecf0f1' }}>
                      <td style={{ padding: '15px' }}>{invoice.student.firstName} {invoice.student.lastName}</td>
                      <td style={{ padding: '15px' }}>{invoice.term.name}</td>
                      <td style={{ padding: '15px' }}>₦{invoice.totalAmount.toLocaleString()}</td>
                      <td style={{ padding: '15px', fontWeight: 'bold', color: '#27ae60' }}>₦{invoice.amountPaid.toLocaleString()}</td>
                      <td style={{ padding: '15px', fontWeight: 'bold', color: statusColor }}>₦{invoice.balanceDue.toLocaleString()}</td>
                      <td style={{ padding: '15px' }}>
                        <span style={{
                          backgroundColor: statusColor,
                          color: 'white',
                          padding: '5px 10px',
                          borderRadius: '5px',
                          fontWeight: 'bold',
                          fontSize: '12px'
                        }}>
                          {paidPercentage === 100 ? '✅ Paid' : `${Math.round(paidPercentage)}%`}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* PAYMENTS TAB */}
        {activeTab === 'payments' && (
          <div>
            <h2>💳 Payment Records</h2>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              backgroundColor: 'white',
              borderRadius: '10px',
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#34495e', color: 'white' }}>
                  <th style={{ padding: '15px', textAlign: 'left' }}>Date</th>
                  <th style={{ padding: '15px', textAlign: 'left' }}>Student</th>
                  <th style={{ padding: '15px', textAlign: 'left' }}>Term</th>
                  <th style={{ padding: '15px', textAlign: 'left' }}>Amount</th>
                  <th style={{ padding: '15px', textAlign: 'left' }}>Method</th>
                  <th style={{ padding: '15px', textAlign: 'left' }}>Reference</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #ecf0f1' }}>
                    <td style={{ padding: '15px' }}>{new Date(payment.createdAt).toLocaleDateString()}</td>
                    <td style={{ padding: '15px' }}>{payment.invoice.student.firstName} {payment.invoice.student.lastName}</td>
                    <td style={{ padding: '15px' }}>{payment.invoice.term.name}</td>
                    <td style={{ padding: '15px', fontWeight: 'bold', color: '#27ae60' }}>₦{payment.amountPaid.toLocaleString()}</td>
                    <td style={{ padding: '15px' }}>{payment.paymentMethod}</td>
                    <td style={{ padding: '15px', fontSize: '12px', color: '#7f8c8d' }}>{payment.referenceNumber || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* NOTIFICATIONS TAB */}
        {activeTab === 'notifications' && (
          <div>
            <h2>🔔 Payment Notifications</h2>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <p>Recent payments recorded in the system (Last 7 days)</p>
              <button
                onClick={loadNotifications}
                style={{
                  padding: '10px 15px',
                  backgroundColor: '#3498db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                🔄 Refresh
              </button>
            </div>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '15px'
            }}>
              {notifications.length > 0 ? (
                notifications.map((payment, idx) => (
                  <div key={idx} style={{
                    backgroundColor: 'white',
                    padding: '20px',
                    borderRadius: '10px',
                    borderLeft: '5px solid #27ae60',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div>
                        <p style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: 'bold' }}>
                          ✅ Payment Received: {payment.invoice.student.firstName} {payment.invoice.student.lastName}
                        </p>
                        <p style={{ margin: '0 0 5px 0', color: '#7f8c8d' }}>
                          <strong>Amount:</strong> ₦{payment.amountPaid.toLocaleString()}
                        </p>
                        <p style={{ margin: '0 0 5px 0', color: '#7f8c8d' }}>
                          <strong>Term:</strong> {payment.invoice.term.name}
                        </p>
                        <p style={{ margin: '0 0 5px 0', color: '#7f8c8d' }}>
                          <strong>Method:</strong> {payment.paymentMethod}
                        </p>
                        <p style={{ margin: '0', color: '#95a5a6', fontSize: '12px' }}>
                          {new Date(payment.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <span style={{
                        backgroundColor: '#d5f4e6',
                        color: '#27ae60',
                        padding: '8px 12px',
                        borderRadius: '5px',
                        fontWeight: 'bold',
                        fontSize: '12px'
                      }}>
                        New
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{
                  backgroundColor: 'white',
                  padding: '40px',
                  borderRadius: '10px',
                  textAlign: 'center',
                  color: '#7f8c8d'
                }}>
                  No payment notifications in the last 7 days
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DirectorDashboard;
