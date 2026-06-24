import React, { useState } from 'react';
import AdminDashboard from './AdminDashboard';
import DirectorDashboard from './DirectorDashboard';
import AdminLogin from './AdminLogin';
import DirectorLogin from './DirectorLogin';
import SchoolHeader from './SchoolHeader';
import './App.css';

export default function App() {
  const [currentView, setCurrentView] = useState('home');

  const handleAdminLoginSuccess = () => {
    setCurrentView('admin');
  };

  const handleDirectorLoginSuccess = () => {
    setCurrentView('director');
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('directorToken');
    localStorage.removeItem('userRole');
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

      </div>

      <footer className="home-footer">
        <p>&copy; 2026 Albayyan International School. All rights reserved.</p>
      </footer>
    </div>
  );
}
