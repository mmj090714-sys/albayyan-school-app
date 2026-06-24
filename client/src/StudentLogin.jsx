import React, { useState } from 'react';
import './StudentLogin.css';
import SchoolHeader from './SchoolHeader';
import { fetchStudents } from './utils/supabaseClient';

const StudentLogin = ({ onLoginSuccess, onBackHome }) => {
  const [admissionNumber, setAdmissionNumber] = useState('');
  const [parentPhoneNumber, setParentPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate inputs
      if (!admissionNumber.trim()) {
        setError('❌ Please enter admission number');
        setLoading(false);
        return;
      }
      if (!parentPhoneNumber.trim()) {
        setError('❌ Please enter parent phone number');
        setLoading(false);
        return;
      }

      // Fetch students and validate
      const students = await fetchStudents();
      const student = students.find(
        s => s.admissionNumber === admissionNumber.trim()
      );

      if (!student) {
        setError('❌ Student not found. Please check your admission number');
        setLoading(false);
        return;
      }

      // Simple validation - in production, you'd verify the phone number matches
      // For now, just checking the admission number is enough
      if (student.parentPhoneNumber !== parentPhoneNumber.trim()) {
        setError('⚠️ Phone number does not match our records');
        setLoading(false);
        return;
      }

      // Store student info in localStorage
      localStorage.setItem('studentToken', JSON.stringify(student));
      localStorage.setItem('studentId', student.id);
      localStorage.setItem('userRole', 'student');

      // Call success handler
      onLoginSuccess(student);
    } catch (error) {
      console.error('Login error:', error);
      setError('❌ Error logging in: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="student-login">
      <SchoolHeader />

      <div className="login-container">
        <div className="login-card student-card">
          <div className="login-icon">
            <i className="fas fa-user-graduate"></i>
          </div>

          <h1>Student Portal</h1>
          <p className="login-subtitle">View your invoices and payment history</p>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label htmlFor="admission">
                <i className="fas fa-id-card"></i>
                Admission Number
              </label>
              <input
                type="text"
                id="admission"
                placeholder="e.g., ALB/2024/001"
                value={admissionNumber}
                onChange={(e) => setAdmissionNumber(e.target.value)}
                disabled={loading}
                autoFocus
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">
                <i className="fas fa-phone"></i>
                Parent Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                placeholder="e.g., 08012345678"
                value={parentPhoneNumber}
                onChange={(e) => setParentPhoneNumber(e.target.value)}
                disabled={loading}
              />
              <small>We use this to verify your identity</small>
            </div>

            <button
              type="submit"
              className="login-button"
              disabled={loading}
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner"></i> Logging in...
                </>
              ) : (
                <>
                  <i className="fas fa-sign-in-alt"></i> Access Student Portal
                </>
              )}
            </button>
          </form>

          <div className="login-footer">
            <p className="secondary-text">
              Don't have your details? Contact your school office.
            </p>
          </div>

          <button
            onClick={onBackHome}
            className="back-home-button"
          >
            <i className="fas fa-arrow-left"></i> Back to Home
          </button>
        </div>

        <div className="login-info">
          <div className="info-card">
            <h3>📄 View Invoices</h3>
            <p>See all your school fee invoices with detailed breakdown of charges</p>
          </div>
          <div className="info-card">
            <h3>✓ Track Payments</h3>
            <p>Monitor your payment history and get confirmation receipts</p>
          </div>
          <div className="info-card">
            <h3>💾 Download Records</h3>
            <p>Download PDF invoices and payment receipts anytime</p>
          </div>
          <div className="info-card">
            <h3>📊 Payment Status</h3>
            <p>Check your payment status and outstanding balance at a glance</p>
          </div>
        </div>
      </div>

      <footer className="login-footer">
        <p>&copy; 2026 Albayyan International School. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default StudentLogin;
