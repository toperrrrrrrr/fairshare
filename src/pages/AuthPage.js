import React, { useState, useEffect } from 'react';
import { registerUser, loginUser } from '../services/authService';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import './AuthPage.css';

const AuthPage = () => {
  const [activeTab, setActiveTab] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      navigate('/dashboard');
    }
  }, [user, authLoading, navigate]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setError('');
    setEmail('');
    setPassword('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (activeTab === 'login') {
        await loginUser(email, password);
      } else {
        await registerUser(email, password);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Authentication failed');
    }
    setLoading(false);
  };

  if (authLoading) {
    return <div className="auth-bg"><div className="auth-card"><div>Loading...</div></div></div>;
  }

  return (
    <div className="auth-bg">
      <div className="auth-card">
        <h2 className="auth-title">FairShare</h2>
        <div className="tabs">
          <button
            className={activeTab === 'login' ? 'active' : ''}
            onClick={() => handleTabChange('login')}
          >
            Login
          </button>
          <button
            className={activeTab === 'register' ? 'active' : ''}
            onClick={() => handleTabChange('register')}
          >
            Register
          </button>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label>Email</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <label>Password</label>
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <div className="error">{error}</div>}
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? (activeTab === 'login' ? 'Logging in...' : 'Registering...') : (activeTab === 'login' ? 'Login' : 'Register')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AuthPage;