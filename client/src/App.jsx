import React, { useState } from 'react';
import AdminDashboard from './AdminDashboard';
import DirectorDashboard from './DirectorDashboard';
import StudentPortal from './StudentPortal';
import AdminLogin from './AdminLogin';
import DirectorLogin from './DirectorLogin';
import StudentLogin from './StudentLogin';
import SchoolHeader from './SchoolHeader';
import './App.css';

export default function App() {
  const [currentView, setCurrentView] = useState('home');
  const [studentData, setStudentData] = useState(null);

  const handleAdminLoginSuccess = () => {
    setCurrentView('admin');
  };

  const handleDirectorLoginSuccess = () => {
    setCurrentView('director');
  };

  const handleStudentLoginSuccess = (student) => {
    setStudentData(student);
    setCurrentView('student');
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('directorToken');
    localStorage.removeItem('studentToken');
    localStorage.removeItem('studentId');
    localStorage.removeItem('userRole');
    setStudentData(null);
    setCurrentView('home');
  };

  const handleBackHome = () => {
    setCurrentView('home');
  };

  // Admin Login View
  if (currentView === 'adminLogin') {
    return (
      <AdminLogin 
        onLoginSuccess={handleAdminLoginSuccess}
        onBackHome={handleBackHome}
      />
    );
  }

  // Student Login View
  if (currentView === 'studentLogin') {
    return (
      <StudentLogin 
        onLoginSuccess={handleStudentLoginSuccess}
        onBackHome={handleBackHome}
      />
    );
  }

  // Student Portal View
  if (currentView === 'student' && studentData) {
    return (
      <StudentPortal 
        student={studentData} 
        onLogout={handleLogout} 
      />
    );
  }

  // Director Login View
  if (currentView === 'directorLogin') {
    return (
      <DirectorLogin 
        onLoginSuccess={handleDirectorLoginSuccess}
        onBackHome={handleBackHome}
      />
    );
  }

  // Admin Dashboard View
  if (currentView === 'admin') {
    return (
      <>
        <button className="back-button" onClick={handleLogout} title="Go back to home">
          <i className="fas fa-arrow-left"></i> Back Home
        </button>
        <AdminDashboard onLogout={handleLogout} />
      </>
    );
  }

  // Director Dashboard View
  if (currentView === 'director') {
    return (
      <>
        <button className="back-button" onClick={handleLogout} title="Go back to home">
          <i className="fas fa-arrow-left"></i> Back Home
        </button>
        <DirectorDashboard onLogout={handleLogout} />
      </>
    );
  }

  // Home Page
  return (
    <div className="home-page">
      <SchoolHeader />

      <div className="home-container">
        <div className="portal-card admin-portal">
          <div className="portal-icon">
            <i className="fas fa-cogs"></i>
          </div>
          <h2>Admin Dashboard</h2>
          <p>Manage students, fees, invoices, and process payments with full control</p>
          <button onClick={() => setCurrentView('adminLogin')} className="portal-button">
            <i className="fas fa-lock"></i>Access Admin Portal
          </button>
        </div>

        <div className="portal-card director-portal">
          <div className="portal-icon">
            <i className="fas fa-user-tie"></i>
          </div>
          <h2>Director Portal</h2>
          <p>Supervise student registrations and payment records with real-time insights</p>
          <button onClick={() => setCurrentView('directorLogin')} className="portal-button">
            <i className="fas fa-eye"></i>Access Director Portal
          </button>
        </div>

        <div className="portal-card student-portal">
          <div className="portal-icon">
            <i className="fas fa-user-graduate"></i>
          </div>
          <h2>Student Portal</h2>
          <p>View your invoices, check payment status, and download payment receipts</p>
          <button onClick={() => setCurrentView('studentLogin')} className="portal-button">
            <i className="fas fa-sign-in-alt"></i>Access Student Portal
          </button>
        </div>
      </div>

      <footer className="home-footer">
        <p>&copy; 2026 Albayyan International School. All rights reserved.</p>
      </footer>
    </div>
  );
}
