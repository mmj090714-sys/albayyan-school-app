import React, { useState } from 'react';
import axios from 'axios';
import './AuthPages.css';
import SchoolHeader from './SchoolHeader';

const AdminLogin = ({ onLoginSuccess, onBackHome }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/api/auth/admin/login', {
        username,
        password
      });

      if (response.data.token) {
        localStorage.setItem('adminToken', response.data.token);
        localStorage.setItem('userRole', 'admin');
        setUsername('');
        setPassword('');
        onLoginSuccess();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <SchoolHeader />
      <div className="auth-wrapper">
        <div className="auth-card">
          <div className="auth-header">
            <h2>Admin Portal</h2>
            <p>Sign in to manage the system</p>
          </div>

          <form onSubmit={handleLogin} className="auth-form">
            {error && <div className="error-message">{error}</div>}

            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
                disabled={loading}
                autoFocus
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                disabled={loading}
              />
            </div>

            <button type="submit" className="auth-button" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="demo-credentials">
            <p><strong>Demo Credentials:</strong></p>
            <p>Username: <code>admin</code></p>
            <p>Password: <code>Admin@123</code></p>
          </div>

          <button onClick={onBackHome} className="back-to-home-link">
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
