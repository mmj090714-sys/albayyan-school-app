import React, { useState, useEffect } from 'react';
import './AdminDashboard.css';
import ReceiptModal from './ReceiptModal';
import SchoolHeader from './SchoolHeader';
import { exportStudentsToExcel, parseStudentsFromExcel, downloadExcelTemplate } from './utils/excelUtils';
import { fetchStudents, createStudent, bulkImportStudents, logout } from './utils/supabaseClient';

// School class constants
const PRIMARY_CLASSES = ['Creche', 'Reception 1', 'Reception 2', 'Nursery 1', 'Nursery 2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4'];
const SECONDARY_CLASSES = ['JSS 1', 'JSS 2', 'JSS 3', 'SS 1', 'SS 2', 'SS 3'];

const AdminDashboard = ({ onLogout }) => {
  const [adminToken] = useState(localStorage.getItem('adminToken'));
  const [activeTab, setActiveTab] = useState('dashboard');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Receipt Modal
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedPaymentForReceipt, setSelectedPaymentForReceipt] = useState(null);
  
  // Dashboard
  const [stats, setStats] = useState(null);
  
  // Students
  const [students, setStudents] = useState([]);
  const [newStudent, setNewStudent] = useState({ 
    firstName: '', 
    lastName: '', 
    school: 'Secondary',
    classLevel: 'JSS 1', 
    parentPhoneNumber: '', 
    boardingStatus: false,
    takesSchoolBus: false
  });
  const [editingStudent, setEditingStudent] = useState(null);
  
  // Excel Import/Export
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState(null);
  
  // Sessions
  const [sessions, setSessions] = useState([]);
  const [newSession, setNewSession] = useState({ name: '', startDate: '', endDate: '' });
  const [editingSession, setEditingSession] = useState(null);
  
  // Terms
  const [terms, setTerms] = useState([]);
  const [selectedSessionForTerms, setSelectedSessionForTerms] = useState('');
  const [newTerm, setNewTerm] = useState({ sessionId: '', name: '', startDate: '', endDate: '' });
  const [editingTerm, setEditingTerm] = useState(null);
  
  // Fee Structures
  const [feeStructures, setFeeStructures] = useState([]);
  const [selectedTermForFees, setSelectedTermForFees] = useState('');
  const [newFee, setNewFee] = useState({
    sessionId: '',
    termId: '',
    classLevel: 'JSS 1',
    newStudentBaseTuition: 0,
    newStudentBoardingFee: 0,
    newStudentSchoolBusFee: 0,
    returningStudentBaseTuition: 0,
    returningStudentBoardingFee: 0,
    returningStudentSchoolBusFee: 0
  });
  
  // Invoices
  const [invoices, setInvoices] = useState([]);
  const [newInvoice, setNewInvoice] = useState({ studentId: '', feeStructureId: '', termId: '', dueDate: '' });
  
  // Payments
  const [payments, setPayments] = useState([]);
  const [newPayment, setNewPayment] = useState({ invoiceId: '', amountPaid: 0, paymentMethod: 'Bank Transfer', transactionReference: '', recordedBy: 'Admin', bankName: '', receiptNumber: '', paidByName: '', paidDate: '' });

  // Debtors
  const [debtorsFilterTerm, setDebtorsFilterTerm] = useState('');
  const [debtorsFilterClass, setDebtorsFilterClass] = useState('');

  // Show success message
  const showSuccess = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // Load data based on active tab
  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const studentsData = await fetchStudents();
      setStudents(studentsData);
      
      // Calculate stats from students
      const totalStudents = studentsData.length;
      const totalAmount = studentsData.reduce((sum, s) => sum + s.totalAmount, 0);
      const paidAmount = studentsData.reduce((sum, s) => sum + s.paidAmount, 0);
      
      setStats({
        totalStudents,
        totalAmount,
        paidAmount,
        pendingAmount: totalAmount - paidAmount,
        paymentPercentage: totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0
      });
    } catch (error) {
      console.error('Error loading dashboard:', error);
      showSuccess('Error loading data: ' + error.message);
    }
  };

  // ===== STUDENT OPERATIONS =====
  const handleCreateStudent = async (e) => {
    e.preventDefault();
    try {
      const newStudentData = {
        firstName: newStudent.firstName,
        lastName: newStudent.lastName,
        email: newStudent.email || '',
        phone: newStudent.parentPhoneNumber || '',
        level: newStudent.school === 'Primary' ? 'Primary' : 'Secondary',
        busUser: newStudent.takesSchoolBus
      };
      
      await createStudent(newStudentData);
      showSuccess('✅ Student created successfully');
      setNewStudent({ 
        firstName: '', 
        lastName: '', 
        school: 'Secondary',
        classLevel: 'JSS 1', 
        parentPhoneNumber: '', 
        boardingStatus: false,
        takesSchoolBus: false
      });
      loadDashboard();
    } catch (error) {
      showSuccess('❌ Error: ' + error.message);
    }
  };

  const handleExcelImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsImporting(true);
    try {
      const parsedStudents = await parseStudentsFromExcel(file);
      const results = await bulkImportStudents(parsedStudents);
      setImportResults(results);
      showSuccess(`✅ Imported ${results.successful} students, ${results.failed} failed`);
      loadDashboard();
    } catch (error) {
      showSuccess('❌ Error: ' + error.message);
    } finally {
      setIsImporting(false);
    }
  };

  const handleExcelExport = () => {
    try {
      exportStudentsToExcel(students);
      showSuccess('✅ Exported students to Excel');
    } catch (error) {
      showSuccess('❌ Error: ' + error.message);
    }
  };

  const handleLogoutClick = () => {
    logout();
    onLogout();
  };
      } catch (error) {
        showSuccess('❌ Error: ' + error.response?.data?.error);
      }
    }
  };

  const handleActivateSession = async (id) => {
    try {
      await axios.put(`${API_URL}/admin/sessions/${id}`, { isActive: true }, { headers });
      showSuccess('✅ Session activated 🎓');
      loadDashboard();
    } catch (error) {
      showSuccess('❌ Error: ' + error.response?.data?.error);
    }
  };

  // ===== TERM OPERATIONS =====
  const handleLoadTermsForSession = async (sessionId) => {
    if (!sessionId) {
      setTerms([]);
      return;
    }
    try {
      const res = await axios.get(`${API_URL}/admin/sessions/${sessionId}/terms`, { headers });
      setTerms(res.data);
      setSelectedSessionForTerms(sessionId);
    } catch (error) {
      console.error('Error loading terms:', error);
    }
  };

  const handleCreateTerm = async (e) => {
    e.preventDefault();
    try {
      if (!selectedSessionForTerms) {
        showSuccess('❌ Please select a session first');
        return;
      }
      
      if (editingTerm) {
        await axios.put(`${API_URL}/admin/terms/${editingTerm}`, newTerm, { headers });
        showSuccess('✅ Term updated');
      } else {
        const data = { ...newTerm, sessionId: selectedSessionForTerms };
        await axios.post(`${API_URL}/admin/terms`, data, { headers });
        showSuccess('✅ Term created successfully 📖');
      }
      setNewTerm({ sessionId: '', name: '', startDate: '', endDate: '' });
      setEditingTerm(null);
      handleLoadTermsForSession(selectedSessionForTerms);
    } catch (error) {
      showSuccess('❌ Error: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDeleteTerm = async (id) => {
    if (window.confirm('Delete this term and all invoices? 🗑️')) {
      try {
        await axios.delete(`${API_URL}/admin/terms/${id}`, { headers });
        showSuccess('✅ Term deleted');
        handleLoadTermsForSession(selectedSessionForTerms);
      } catch (error) {
        showSuccess('❌ Error: ' + error.response?.data?.error);
      }
    }
  };

  const handleCarryForwardBalances = async (termId) => {
    if (window.confirm('Carry forward outstanding balances to this term? 🔄')) {
      try {
        const res = await axios.post(`${API_URL}/admin/terms/${termId}/carry-forward-balances`, {}, { headers });
        showSuccess(`✅ ${res.data.results.length} students carried forward 💳`);
        handleLoadTermsForSession(selectedSessionForTerms);
      } catch (error) {
        showSuccess('❌ Error: ' + (error.response?.data?.message || error.response?.data?.error));
      }
    }
  };

  // ===== STUDENT OPERATIONS =====
  const handleCreateStudent = async (e) => {
    e.preventDefault();
    try {
      if (editingStudent) {
        await axios.put(`${API_URL}/admin/students/${editingStudent}`, newStudent, { headers });
        showSuccess('✅ Student updated');
      } else {
        await axios.post(`${API_URL}/admin/students`, newStudent, { headers });
        showSuccess('✅ Student created 🎓');
      }
      setNewStudent({ firstName: '', lastName: '', school: 'Secondary', classLevel: 'JSS 1', parentPhoneNumber: '', boardingStatus: false, takesSchoolBus: false });
      setEditingStudent(null);
      loadDashboard();
    } catch (error) {
      showSuccess('❌ Error: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleEditStudent = (student) => {
    setEditingStudent(student.id);
    setNewStudent(student);
  };

  const handleDeleteStudent = async (id) => {
    if (window.confirm('Delete this student? 🗑️')) {
      try {
        await axios.delete(`${API_URL}/admin/students/${id}`, { headers });
        showSuccess('✅ Student deleted');
        loadDashboard();
      } catch (error) {
        showSuccess('❌ Error: ' + error.response?.data?.error);
      }
    }
  };

  // ===== EXCEL IMPORT/EXPORT OPERATIONS =====
  const handleExportStudents = () => {
    const result = exportStudentsToExcel(students, 'albayyan_students');
    if (result.success) {
      showSuccess('✅ ' + result.message);
    } else {
      showSuccess('❌ Export failed: ' + result.error);
    }
  };

  const handleDownloadTemplate = () => {
    downloadExcelTemplate();
    showSuccess('✅ Template downloaded');
  };

  const handleImportStudents = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportResults(null);

    try {
      // Parse Excel file
      const parsedStudents = await parseStudentsFromExcel(file);
      
      // Send to backend
      const response = await axios.post(
        `${API_URL}/admin/students/bulk/import`,
        { students: parsedStudents },
        { headers }
      );

      setImportResults(response.data);
      showSuccess(`✅ Imported ${response.data.successful} students`);
      
      // Reload students
      setTimeout(() => loadDashboard(), 1000);
    } catch (error) {
      console.error('Import error:', error);
      showSuccess('❌ Import failed: ' + (error.message || 'Unknown error'));
    } finally {
      setIsImporting(false);
      // Reset file input
      event.target.value = '';
    }
  };

  // ===== FEE STRUCTURE OPERATIONS =====
  const handleLoadFeesForTerm = async (termId) => {
    if (!termId) return;
    try {
      const res = await axios.get(`${API_URL}/admin/terms/${termId}/fee-structures`, { headers });
      setFeeStructures(res.data);
    } catch (error) {
      console.error('Error loading fees:', error);
    }
  };

  const handleCreateFee = async (e) => {
    e.preventDefault();
    try {
      if (!selectedTermForFees) {
        showSuccess('❌ Please select a term first');
        return;
      }
      
      const sessionId = sessions.find(s => s.terms.some(t => t.id === selectedTermForFees))?.id;
      const data = { ...newFee, sessionId, termId: selectedTermForFees };
      
      await axios.post(`${API_URL}/admin/fee-structures`, data, { headers });
      showSuccess('✅ Fee structure created 💰');
      setNewFee({
        sessionId: '',
        termId: '',
        classLevel: 'JSS 1',
        newStudentBaseTuition: 0,
        newStudentBoardingFee: 0,
        returningStudentBaseTuition: 0,
        returningStudentBoardingFee: 0
      });
      handleLoadFeesForTerm(selectedTermForFees);
    } catch (error) {
      showSuccess('❌ Error: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDeleteFee = async (id) => {
    if (window.confirm('Delete this fee structure? 🗑️')) {
      try {
        await axios.delete(`${API_URL}/admin/fee-structures/${id}`, { headers });
        showSuccess('✅ Fee deleted');
        handleLoadFeesForTerm(selectedTermForFees);
      } catch (error) {
        showSuccess('❌ Error: ' + error.response?.data?.error);
      }
    }
  };

  // ===== INVOICE OPERATIONS =====
  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/admin/invoices`, newInvoice, { headers });
      showSuccess('✅ Invoice created 📄');
      setNewInvoice({ studentId: '', feeStructureId: '', termId: '', dueDate: '' });
      loadDashboard();
    } catch (error) {
      showSuccess('❌ Error: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDeleteInvoice = async (id) => {
    if (window.confirm('Delete this invoice? 🗑️')) {
      try {
        await axios.delete(`${API_URL}/admin/invoices/${id}`, { headers });
        showSuccess('✅ Invoice deleted');
        loadDashboard();
      } catch (error) {
        showSuccess('❌ Error: ' + error.response?.data?.error);
      }
    }
  };

  // ===== PAYMENT OPERATIONS =====
  const handleRecordPayment = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/admin/payments`, newPayment, { headers });
      showSuccess('✅ Payment recorded 💳');
      setNewPayment({ invoiceId: '', amountPaid: 0, paymentMethod: 'Bank Transfer', transactionReference: '', recordedBy: 'Admin', bankName: '', receiptNumber: '', paidByName: '', paidDate: '' });
      loadDashboard();
    } catch (error) {
      showSuccess('❌ Error: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDeletePayment = async (id) => {
    if (window.confirm('Delete this payment and revert balance? 🗑️')) {
      try {
        await axios.delete(`${API_URL}/admin/payments/${id}`, { headers });
        showSuccess('✅ Payment deleted and balance reverted');
        loadDashboard();
      } catch (error) {
        showSuccess('❌ Error: ' + error.response?.data?.error);
      }
    }
  };

  const handleViewReceipt = (payment) => {
    setSelectedPaymentForReceipt(payment);
    setIsReceiptModalOpen(true);
  };

  return (
    <div className="admin-container">
      {successMessage && <div className="success-toast">{successMessage}</div>}
      
      <SchoolHeader />
      
      <div className="admin-header-actions">
        <button className="logout-btn" onClick={onLogout}>🚪 Logout</button>
      </div>

      <div className="admin-content">
        <div className="admin-tabs">
          <button className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
            📈 Dashboard
          </button>
          <button className={`tab-btn ${activeTab === 'sessions' ? 'active' : ''}`} onClick={() => setActiveTab('sessions')}>
            📅 Sessions & Terms
          </button>
          <button className={`tab-btn ${activeTab === 'students' ? 'active' : ''}`} onClick={() => setActiveTab('students')}>
            🎓 Students
          </button>
          <button className={`tab-btn ${activeTab === 'fees' ? 'active' : ''}`} onClick={() => setActiveTab('fees')}>
            💰 Fee Structures
          </button>
          <button className={`tab-btn ${activeTab === 'invoices' ? 'active' : ''}`} onClick={() => setActiveTab('invoices')}>
            📄 Invoices
          </button>
          <button className={`tab-btn ${activeTab === 'payments' ? 'active' : ''}`} onClick={() => setActiveTab('payments')}>
            💳 Payments
          </button>
          <button className={`tab-btn ${activeTab === 'debtors' ? 'active' : ''}`} onClick={() => setActiveTab('debtors')}>
            🔴 Debtors
          </button>
        </div>

        {/* DASHBOARD TAB */}
      {activeTab === 'dashboard' && stats && (
        <div className="tab-content">
          <h2>📊 Dashboard Overview</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <h3>👥 Total Students</h3>
              <p className="stat-number">{stats.totalStudents}</p>
              <small>🆕 New: {stats.newStudents}</small>
            </div>
            <div className="stat-card">
              <h3>💵 Total Collected</h3>
              <p className="stat-number">₦{stats.totalCollected.toLocaleString()}</p>
            </div>
            <div className="stat-card">
              <h3>� Total Expected</h3>
              <p className="stat-number">₦{(stats.totalCollected + stats.outstandingBalance).toLocaleString()}</p>
              <small>Collection Rate: {stats.totalCollected + stats.outstandingBalance > 0 ? Math.round((stats.totalCollected / (stats.totalCollected + stats.outstandingBalance)) * 100) : 0}%</small>
            </div>
            <div className="stat-card">
              <h3>�💳 Outstanding Balance</h3>
              <p className="stat-number">₦{stats.outstandingBalance.toLocaleString()}</p>
            </div>
            <div className="stat-card">
              <h3>✅ Paid Invoices</h3>
              <p className="stat-number">{stats.paidInvoices}/{stats.totalInvoices}</p>
            </div>
            <div className="stat-card">
              <h3>📅 Active Sessions</h3>
              <p className="stat-number">{stats.activeSessions}/{stats.totalSessions}</p>
            </div>
          </div>
        </div>
      )}

      {/* SESSIONS & TERMS TAB */}
      {activeTab === 'sessions' && (
        <div className="tab-content">
          <h2>📅 Sessions & Terms Management</h2>
          
          <div className="section">
            <h3>📅 Create/Edit Session</h3>
            <form className="form" onSubmit={handleCreateSession}>
              <div className="form-row">
                <div className="input-wrapper">
                  <i className="fas fa-calendar"></i>
                  <input
                    type="text"
                    placeholder="Session Name (e.g., 2025/2026)"
                    value={newSession.name}
                    onChange={(e) => setNewSession({ ...newSession, name: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="input-wrapper">
                  <i className="fas fa-calendar-alt"></i>
                  <input
                    type="date"
                    value={newSession.startDate}
                    onChange={(e) => setNewSession({ ...newSession, startDate: e.target.value })}
                    required
                  />
                </div>
                <div className="input-wrapper">
                  <i className="fas fa-calendar-check"></i>
                  <input
                    type="date"
                    value={newSession.endDate}
                    onChange={(e) => setNewSession({ ...newSession, endDate: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <button className="submit-button" type="submit">
                  {editingSession ? '✏️ Update Session' : '➕ Create Session'}
                </button>
                {editingSession && (
                  <button
                    className="cancel-button"
                    onClick={() => {
                      setEditingSession(null);
                      setNewSession({ name: '', startDate: '', endDate: '' });
                    }}
                  >
                    ❌ Cancel
                  </button>
                )}
              </div>
            </form>

            <h3>📋 Sessions List</h3>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Session</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Status</th>
                  <th>Terms</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map(session => (
                  <tr key={session.id}>
                    <td>{session.name}</td>
                    <td>{new Date(session.startDate).toLocaleDateString()}</td>
                    <td>{new Date(session.endDate).toLocaleDateString()}</td>
                    <td>{session.isActive ? '🎯 Active' : '⏸️ Inactive'}</td>
                    <td>{session.terms.length}</td>
                    <td>
                      {!session.isActive && (
                        <button className="action-btn status" onClick={() => handleActivateSession(session.id)}>
                          🎯
                        </button>
                      )}
                      <button className="action-btn delete" onClick={() => handleDeleteSession(session.id)}>
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="section">
            <h3>📖 Create/Edit Term</h3>
            <div className="input-wrapper">
              <i className="fas fa-filter"></i>
              <select
                value={selectedSessionForTerms}
                onChange={(e) => {
                  setSelectedSessionForTerms(e.target.value);
                  handleLoadTermsForSession(e.target.value);
                }}
                style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
              >
                <option value="">Select a Session</option>
                {sessions.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {selectedSessionForTerms && (
              <>
                <form className="form" onSubmit={handleCreateTerm}>
                  <div className="form-row">
                    <div className="input-wrapper">
                      <i className="fas fa-book"></i>
                      <input
                        type="text"
                        placeholder="Term Name (e.g., Term 1)"
                        value={newTerm.name}
                        onChange={(e) => setNewTerm({ ...newTerm, name: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="input-wrapper">
                      <i className="fas fa-calendar-alt"></i>
                      <input
                        type="date"
                        value={newTerm.startDate}
                        onChange={(e) => setNewTerm({ ...newTerm, startDate: e.target.value })}
                        required
                      />
                    </div>
                    <div className="input-wrapper">
                      <i className="fas fa-calendar-check"></i>
                      <input
                        type="date"
                        value={newTerm.endDate}
                        onChange={(e) => setNewTerm({ ...newTerm, endDate: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <button className="submit-button" type="submit">
                      {editingTerm ? '✏️ Update Term' : '➕ Create Term'}
                    </button>
                    {editingTerm && (
                      <button
                        className="cancel-button"
                        onClick={() => {
                          setEditingTerm(null);
                          setNewTerm({ sessionId: '', name: '', startDate: '', endDate: '' });
                        }}
                      >
                        ❌ Cancel
                      </button>
                    )}
                  </div>
                </form>

                <h3>📖 Terms for {sessions.find(s => s.id === selectedSessionForTerms)?.name}</h3>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Term</th>
                      <th>Start Date</th>
                      <th>End Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {terms.map(term => (
                      <tr key={term.id}>
                        <td>{term.name}</td>
                        <td>{new Date(term.startDate).toLocaleDateString()}</td>
                        <td>{new Date(term.endDate).toLocaleDateString()}</td>
                        <td>
                          <button className="action-btn status" onClick={() => handleCarryForwardBalances(term.id)} title="Carry forward outstanding balances">
                            🔄
                          </button>
                          <button className="action-btn delete" onClick={() => handleDeleteTerm(term.id)}>
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        </div>
      )}

      {/* STUDENTS TAB */}
      {activeTab === 'students' && (
        <div className="tab-content">
          <h2>🎓 Student Management</h2>
          
          {/* Excel Import/Export Section */}
          <div className="excel-actions" style={{
            display: 'flex',
            gap: '10px',
            marginBottom: '20px',
            flexWrap: 'wrap'
          }}>
            <button 
              type="button"
              className="submit-button"
              onClick={handleExportStudents}
              style={{ backgroundColor: '#10b981' }}
              title="Export all students to Excel"
            >
              <i className="fas fa-download"></i> Export Students
            </button>
            
            <button 
              type="button"
              className="submit-button"
              onClick={handleDownloadTemplate}
              style={{ backgroundColor: '#3b82f6' }}
              title="Download Excel template for bulk import"
            >
              <i className="fas fa-file-download"></i> Download Template
            </button>
            
            <label className="submit-button" style={{ backgroundColor: '#f59e0b', cursor: 'pointer', margin: 0 }}>
              <i className="fas fa-upload"></i> Import Students
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleImportStudents}
                disabled={isImporting}
                style={{ display: 'none' }}
              />
            </label>
          </div>

          {/* Import Results */}
          {importResults && (
            <div style={{
              backgroundColor: importResults.failed === 0 ? '#d1fae5' : '#fef3c7',
              border: `2px solid ${importResults.failed === 0 ? '#10b981' : '#f59e0b'}`,
              borderRadius: '8px',
              padding: '15px',
              marginBottom: '20px'
            }}>
              <h4 style={{ margin: '0 0 10px 0' }}>
                {importResults.failed === 0 ? '✅ Import Successful!' : '⚠️ Import Completed with Errors'}
              </h4>
              <p style={{ margin: '5px 0' }}>
                <strong>Successful:</strong> {importResults.successful} students
              </p>
              {importResults.failed > 0 && (
                <>
                  <p style={{ margin: '5px 0' }}>
                    <strong>Failed:</strong> {importResults.failed} students
                  </p>
                  {importResults.errors.length > 0 && (
                    <div style={{ marginTop: '10px', maxHeight: '200px', overflowY: 'auto' }}>
                      <strong>Errors:</strong>
                      <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                        {importResults.errors.map((err, idx) => (
                          <li key={idx} style={{ fontSize: '12px' }}>
                            Row {err.row}: {err.firstName} {err.lastName} - {err.error}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          <form className="form" onSubmit={handleCreateStudent}>
            <h3>{editingStudent ? '✏️ Edit Student' : '➕ Add New Student'}</h3>
            <div className="form-row">
              <div className="input-wrapper">
                <i className="fas fa-user"></i>
                <input
                  type="text"
                  placeholder="First Name"
                  value={newStudent.firstName}
                  onChange={(e) => setNewStudent({ ...newStudent, firstName: e.target.value })}
                  required
                />
              </div>
              <div className="input-wrapper">
                <i className="fas fa-user"></i>
                <input
                  type="text"
                  placeholder="Last Name"
                  value={newStudent.lastName}
                  onChange={(e) => setNewStudent({ ...newStudent, lastName: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="form-row">
              <div className="input-wrapper">
                <i className="fas fa-school"></i>
                <select
                  value={newStudent.school}
                  onChange={(e) => setNewStudent({ 
                    ...newStudent, 
                    school: e.target.value,
                    classLevel: e.target.value === 'Primary' ? 'Creche' : 'JSS 1'
                  })}
                  required
                >
                  <option value="Primary">Primary School</option>
                  <option value="Secondary">Secondary School</option>
                </select>
              </div>
              <div className="input-wrapper">
                <i className="fas fa-book"></i>
                <select
                  value={newStudent.classLevel}
                  onChange={(e) => setNewStudent({ ...newStudent, classLevel: e.target.value })}
                  required
                >
                  {newStudent.school === 'Primary' 
                    ? PRIMARY_CLASSES.map(cls => <option key={cls} value={cls}>{cls}</option>)
                    : SECONDARY_CLASSES.map(cls => <option key={cls} value={cls}>{cls}</option>)
                  }
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="input-wrapper">
                <i className="fas fa-phone"></i>
                <input
                  type="tel"
                  placeholder="Parent Phone Number"
                  value={newStudent.parentPhoneNumber}
                  onChange={(e) => setNewStudent({ ...newStudent, parentPhoneNumber: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="form-row">
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <i className="fas fa-bed"></i>
                <input
                  type="checkbox"
                  checked={newStudent.boardingStatus}
                  onChange={(e) => setNewStudent({ ...newStudent, boardingStatus: e.target.checked })}
                />
                Boarding Student
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <i className="fas fa-bus"></i>
                <input
                  type="checkbox"
                  checked={newStudent.takesSchoolBus}
                  onChange={(e) => setNewStudent({ ...newStudent, takesSchoolBus: e.target.checked })}
                />
                Takes School Bus
              </label>
            </div>
            <div className="form-row">
              <button className="submit-button" type="submit">
                {editingStudent ? '✏️ Update Student' : '➕ Add Student'}
              </button>
              {editingStudent && (
                <button
                  className="cancel-button"
                  onClick={() => {
                    setEditingStudent(null);
                    setNewStudent({ firstName: '', lastName: '', school: 'Secondary', classLevel: 'JSS 1', parentPhoneNumber: '', boardingStatus: false, takesSchoolBus: false });
                  }}
                >
                  ❌ Cancel
                </button>
              )}
            </div>
          </form>

          <h3>👥 Students List</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Admission #</th>
                <th>Name</th>
                <th>School</th>
                <th>Class</th>
                <th>Student Type</th>
                <th>Expected Fees</th>
                <th>Phone Number</th>
                <th>Boarding</th>
                <th>Bus</th>
                <th>Invoices</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map(student => {
                const studentFeeStructure = feeStructures.find(f => f.classLevel === student.classLevel);
                const expectedFees = student.isNewStudent 
                  ? studentFeeStructure?.newStudentTotal || 0
                  : studentFeeStructure?.returningStudentTotal || 0;
                return (
                  <tr key={student.id}>
                    <td>{student.admissionNumber}</td>
                    <td>{student.firstName} {student.lastName}</td>
                    <td><strong>{student.school || 'Secondary'}</strong></td>
                    <td>{student.classLevel}</td>
                    <td>{student.isNewStudent ? '🆕 New' : '↩️ Returning'}</td>
                    <td><strong>₦{expectedFees.toLocaleString()}</strong></td>
                    <td>{student.parentPhoneNumber || '—'}</td>
                    <td>{student.boardingStatus ? '✅ Yes' : '❌ No'}</td>
                    <td>{student.takesSchoolBus ? '🚌 Yes' : '❌ No'}</td>
                    <td>{student.invoices.length}</td>
                    <td>
                      <button className="action-btn edit" onClick={() => handleEditStudent(student)}>
                        ✏️
                      </button>
                      <button className="action-btn delete" onClick={() => handleDeleteStudent(student.id)}>
                        🗑️
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* FEE STRUCTURES TAB */}
      {activeTab === 'fees' && (
        <div className="tab-content">
          <h2>💰 Fee Structures (New vs Returning Students)</h2>
          
          <div className="input-wrapper">
            <i className="fas fa-filter"></i>
            <select
              value={selectedTermForFees}
              onChange={(e) => {
                setSelectedTermForFees(e.target.value);
                handleLoadFeesForTerm(e.target.value);
              }}
              style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
            >
              <option value="">Select a Term</option>
              {sessions.map(session =>
                session.terms.map(term => (
                  <option key={term.id} value={term.id}>
                    {session.name} - {term.name}
                  </option>
                ))
              )}
            </select>
          </div>

          {selectedTermForFees && (
            <form className="form" onSubmit={handleCreateFee}>
              <h3>➕ Create New Fee Structure</h3>
              <div className="form-row">
                <div className="input-wrapper">
                  <i className="fas fa-book"></i>
                  <select
                    value={newFee.classLevel}
                    onChange={(e) => setNewFee({ ...newFee, classLevel: e.target.value })}
                  >
                    <option>JSS 1</option>
                    <option>JSS 2</option>
                    <option>JSS 3</option>
                    <option>SS 1</option>
                    <option>SS 2</option>
                    <option>SS 3</option>
                  </select>
                </div>
              </div>
              
              <h4>🆕 New Student Fees</h4>
              <div className="form-row">
                <div className="input-wrapper">
                  <i className="fas fa-dollar-sign"></i>
                  <input
                    type="number"
                    placeholder="Base Tuition"
                    value={newFee.newStudentBaseTuition}
                    onChange={(e) => setNewFee({ ...newFee, newStudentBaseTuition: parseFloat(e.target.value) })}
                    required
                  />
                </div>
                <div className="input-wrapper">
                  <i className="fas fa-home"></i>
                  <input
                    type="number"
                    placeholder="Boarding Fee (0 if none)"
                    value={newFee.newStudentBoardingFee}
                    onChange={(e) => setNewFee({ ...newFee, newStudentBoardingFee: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="input-wrapper">
                  <i className="fas fa-bus"></i>
                  <input
                    type="number"
                    placeholder="School Bus Fee (0 if none)"
                    value={newFee.newStudentSchoolBusFee}
                    onChange={(e) => setNewFee({ ...newFee, newStudentSchoolBusFee: parseFloat(e.target.value) })}
                  />
                </div>
              </div>

              <h4>↩️ Returning Student Fees</h4>
              <div className="form-row">
                <div className="input-wrapper">
                  <i className="fas fa-dollar-sign"></i>
                  <input
                    type="number"
                    placeholder="Base Tuition"
                    value={newFee.returningStudentBaseTuition}
                    onChange={(e) => setNewFee({ ...newFee, returningStudentBaseTuition: parseFloat(e.target.value) })}
                    required
                  />
                </div>
                <div className="input-wrapper">
                  <i className="fas fa-home"></i>
                  <input
                    type="number"
                    placeholder="Boarding Fee (0 if none)"
                    value={newFee.returningStudentBoardingFee}
                    onChange={(e) => setNewFee({ ...newFee, returningStudentBoardingFee: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="input-wrapper">
                  <i className="fas fa-bus"></i>
                  <input
                    type="number"
                    placeholder="School Bus Fee (0 if none)"
                    value={newFee.returningStudentSchoolBusFee}
                    onChange={(e) => setNewFee({ ...newFee, returningStudentSchoolBusFee: parseFloat(e.target.value) })}
                  />
                </div>
              </div>

              <div className="form-row">
                <button className="submit-button" type="submit">
                  ➕ Create Fee Structure
                </button>
              </div>
            </form>
          )}

          <h3>📋 Fee Structures</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Session - Term</th>
                <th>Class</th>
                <th>🆕 New (Tuition)</th>
                <th>↩️ Returning (Tuition)</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {feeStructures.filter(fee => !selectedTermForFees || fee.term.id === selectedTermForFees).map(fee => (
                <tr key={fee.id}>
                  <td>{fee.session.name} - {fee.term.name}</td>
                  <td>{fee.classLevel}</td>
                  <td>₦{fee.newStudentTotal.toLocaleString()}</td>
                  <td>₦{fee.returningStudentTotal.toLocaleString()}</td>
                  <td>
                    <button className="action-btn delete" onClick={() => handleDeleteFee(fee.id)}>
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* INVOICES TAB */}
      {activeTab === 'invoices' && (
        <div className="tab-content">
          <h2>📄 Invoice Management</h2>
          <form className="form" onSubmit={handleCreateInvoice}>
            <h3>➕ Create Invoice</h3>
            <div className="form-row">
              <div className="input-wrapper">
                <i className="fas fa-user"></i>
                <select
                  value={newInvoice.studentId}
                  onChange={(e) => setNewInvoice({ ...newInvoice, studentId: e.target.value })}
                  required
                >
                  <option value="">Select Student</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.admissionNumber})</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="input-wrapper">
                <i className="fas fa-book"></i>
                <select
                  value={newInvoice.termId}
                  onChange={(e) => setNewInvoice({ ...newInvoice, termId: e.target.value })}
                  required
                >
                  <option value="">Select Term</option>
                  {terms.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="input-wrapper">
                <i className="fas fa-dollar-sign"></i>
                <select
                  value={newInvoice.feeStructureId}
                  onChange={(e) => setNewInvoice({ ...newInvoice, feeStructureId: e.target.value })}
                  required
                >
                  <option value="">Select Fee Structure</option>
                  {feeStructures.map(f => (
                    <option key={f.id} value={f.id}>{f.classLevel} - ₦{f.newStudentTotal}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="input-wrapper">
                <i className="fas fa-calendar"></i>
                <input
                  type="date"
                  value={newInvoice.dueDate}
                  onChange={(e) => setNewInvoice({ ...newInvoice, dueDate: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="form-row">
              <button className="submit-button" type="submit">
                ➕ Create Invoice
              </button>
            </div>
          </form>

          <h3>📋 All Invoices</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Term</th>
                <th>Amount</th>
                <th>Paid</th>
                <th>Balance</th>
                <th>Status</th>
                <th>Due Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv.id}>
                  <td>{inv.student.firstName} {inv.student.lastName}</td>
                  <td>{inv.term.name}</td>
                  <td>₦{inv.totalAmount.toLocaleString()}</td>
                  <td>₦{inv.amountPaid.toLocaleString()}</td>
                  <td>₦{inv.balanceDue.toLocaleString()}</td>
                  <td>
                    <span className={`status-${inv.status.toLowerCase()}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td>{new Date(inv.dueDate).toLocaleDateString()}</td>
                  <td>
                    <button className="action-btn delete" onClick={() => handleDeleteInvoice(inv.id)}>
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* PAYMENTS TAB */}
      {activeTab === 'payments' && (
        <div className="tab-content">
          <h2>💳 Payment Management</h2>
          <form className="form" onSubmit={handleRecordPayment}>
            <h3>➕ Record Payment</h3>
            <div className="form-row">
              <div className="input-wrapper">
                <i className="fas fa-receipt"></i>
                <select
                  value={newPayment.invoiceId}
                  onChange={(e) => setNewPayment({ ...newPayment, invoiceId: e.target.value })}
                  required
                >
                  <option value="">Select Invoice (with balance)</option>
                  {invoices.filter(inv => inv.balanceDue > 0).map(inv => (
                    <option key={inv.id} value={inv.id}>
                      {inv.student.firstName} {inv.student.lastName} - Balance: ₦{inv.balanceDue.toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="input-wrapper">
                <i className="fas fa-dollar-sign"></i>
                <input
                  type="number"
                  placeholder="Amount Paid"
                  value={newPayment.amountPaid}
                  onChange={(e) => setNewPayment({ ...newPayment, amountPaid: parseFloat(e.target.value) })}
                  required
                />
              </div>
              <div className="input-wrapper">
                <i className="fas fa-credit-card"></i>
                <select
                  value={newPayment.paymentMethod}
                  onChange={(e) => setNewPayment({ ...newPayment, paymentMethod: e.target.value })}
                >
                  <option>Bank Transfer</option>
                  <option>Cash</option>
                  <option>Online</option>
                </select>
              </div>
              <div className="input-wrapper">
                <i className="fas fa-bank"></i>
                <select
                  value={newPayment.bankName}
                  onChange={(e) => setNewPayment({ ...newPayment, bankName: e.target.value })}
                >
                  <option value="">Select Bank</option>
                  <option>UBA</option>
                  <option>Sterling</option>
                  <option>Unity</option>
                  <option>Moniepoint</option>
                  <option>Cash</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="input-wrapper">
                <i className="fas fa-receipt"></i>
                <input
                  type="text"
                  placeholder="Receipt Number"
                  value={newPayment.receiptNumber}
                  onChange={(e) => setNewPayment({ ...newPayment, receiptNumber: e.target.value })}
                  required
                />
              </div>
              <div className="input-wrapper">
                <i className="fas fa-user"></i>
                <input
                  type="text"
                  placeholder="Name of Person Who Paid"
                  value={newPayment.paidByName}
                  onChange={(e) => setNewPayment({ ...newPayment, paidByName: e.target.value })}
                  required
                />
              </div>
              <div className="input-wrapper">
                <i className="fas fa-calendar"></i>
                <input
                  type="date"
                  value={newPayment.paidDate}
                  onChange={(e) => setNewPayment({ ...newPayment, paidDate: e.target.value })}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="input-wrapper">
                <i className="fas fa-barcode"></i>
                <input
                  type="text"
                  placeholder="Transaction Reference (Optional)"
                  value={newPayment.transactionReference}
                  onChange={(e) => setNewPayment({ ...newPayment, transactionReference: e.target.value })}
                />
              </div>
            </div>
            <div className="form-row">
              <button className="submit-button" type="submit">
                ✅ Record Payment
              </button>
            </div>
          </form>

          <h3>💳 Payment History</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Amount</th>
                <th>Receipt #</th>
                <th>Paid By</th>
                <th>Bank</th>
                <th>Date</th>
                <th>Method</th>
                <th>Reference</th>
                <th>Recorded By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(pay => (
                <tr key={pay.id}>
                  <td>{pay.invoice.student.firstName} {pay.invoice.student.lastName}</td>
                  <td>₦{pay.amountPaid.toLocaleString()}</td>
                  <td>{pay.receiptNumber || '—'}</td>
                  <td>{pay.paidByName || '—'}</td>
                  <td><span className="bank-badge">{pay.bankName || '—'}</span></td>
                  <td>{new Date(pay.paymentDate).toLocaleDateString()}</td>
                  <td><span className="method-badge">{pay.paymentMethod}</span></td>
                  <td>{pay.transactionReference}</td>
                  <td>{pay.recordedBy}</td>
                  <td>
                    <button className="action-btn" onClick={() => handleViewReceipt(pay)} title="View and print receipt">
                      🧾
                    </button>
                    <button className="action-btn delete" onClick={() => handleDeletePayment(pay.id)} title="Delete payment">
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* DEBTORS TAB */}
      {activeTab === 'debtors' && (
        <div className="tab-content">
          <h2>🔴 Debtors Report</h2>
          
          <div className="debtors-filters" style={{ display: 'flex', gap: '15px', marginBottom: '20px', padding: '15px', backgroundColor: '#f0f0f0', borderRadius: '8px' }}>
            <div className="input-wrapper" style={{ flex: 1 }}>
              <i className="fas fa-book"></i>
              <select
                value={debtorsFilterTerm}
                onChange={(e) => setDebtorsFilterTerm(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
              >
                <option value="">All Terms</option>
                {terms.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div className="input-wrapper" style={{ flex: 1 }}>
              <i className="fas fa-building"></i>
              <select
                value={debtorsFilterClass}
                onChange={(e) => setDebtorsFilterClass(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
              >
                <option value="">All Classes</option>
                {[...new Set(students.map(s => s.classLevel))].map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
            </div>
            <button 
              onClick={() => window.print()} 
              style={{ padding: '10px 20px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}
            >
              🖨️ Print Report
            </button>
          </div>

          <h3>📋 Outstanding Invoices</h3>
          <table className="data-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Admission #</th>
                <th>Student Name</th>
                <th>Class</th>
                <th>Term</th>
                <th>Expected Amount</th>
                <th>Paid Amount</th>
                <th>Balance Due</th>
                <th>Days Overdue</th>
              </tr>
            </thead>
            <tbody>
              {invoices
                .filter(inv => {
                  const matchTerm = !debtorsFilterTerm || inv.term?.id === debtorsFilterTerm;
                  const matchClass = !debtorsFilterClass || inv.student?.classLevel === debtorsFilterClass;
                  const hasBalance = inv.balanceDue > 0;
                  return matchTerm && matchClass && hasBalance;
                })
                .map(inv => {
                  const daysOverdue = inv.dueDate ? Math.floor((new Date() - new Date(inv.dueDate)) / (1000 * 60 * 60 * 24)) : 0;
                  return (
                    <tr key={inv.id} style={{ backgroundColor: daysOverdue > 30 ? '#fee' : daysOverdue > 0 ? '#ffeaa7' : 'white' }}>
                      <td>{inv.student?.admissionNumber}</td>
                      <td>{inv.student?.firstName} {inv.student?.lastName}</td>
                      <td>{inv.student?.classLevel}</td>
                      <td>{inv.term?.name}</td>
                      <td>₦{inv.totalAmount.toLocaleString()}</td>
                      <td>₦{inv.amountPaid.toLocaleString()}</td>
                      <td><strong>₦{inv.balanceDue.toLocaleString()}</strong></td>
                      <td style={{ color: daysOverdue > 30 ? '#d32f2f' : daysOverdue > 0 ? '#f57f17' : '#4caf50', fontWeight: 'bold' }}>
                        {daysOverdue > 0 ? `${daysOverdue}d` : '—'}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      )}
      </div>

      {/* Receipt Modal */}
      <ReceiptModal 
        payment={selectedPaymentForReceipt} 
        isOpen={isReceiptModalOpen} 
        onClose={() => {
          setIsReceiptModalOpen(false);
          setSelectedPaymentForReceipt(null);
        }}
      />
    </div>
  );
};

export default AdminDashboard;
