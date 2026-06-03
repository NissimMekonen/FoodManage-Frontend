import React, { useState } from 'react';
import './styles/auth.css';
import Register from './Register';
import ForgotPassword from './ForgotPassword';
import PasswordInput from './PasswordInput';

function Login({ onLoginSuccess, sessionExpired }) {
  const [showRegister, setShowRegister] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [registered, setRegistered] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5148/api/Auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('שם משתמש או סיסמה שגויים');

      const data = await response.json();
      sessionStorage.setItem('token', data.token);
      sessionStorage.setItem('username', formData.username);
      onLoginSuccess();

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (showRegister) {
    return (
      <Register
        onRegisterSuccess={() => { setShowRegister(false); setRegistered(true); }}
        onBackToLogin={() => setShowRegister(false)}
      />
    );
  }

  if (showForgot) {
    return <ForgotPassword onBack={() => setShowForgot(false)} />;
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <h1>🍳 FoodManage</h1>
          <p>מערכת ניהול מטבח מקצועית</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>שם משתמש</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="הזן שם משתמש"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>סיסמה</label>
            <PasswordInput
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="הזן סיסמה"
              required
            />
          </div>

          {sessionExpired && (
            <div className="error-message error-message--session">
              פג תוקף החיבור — אנא התחבר מחדש
            </div>
          )}

          {registered && (
            <div className="error-message error-message--success">
              החשבון נוצר בהצלחה — אפשר להתחבר!
            </div>
          )}

          {error && (
            <div className="error-message">⚠️ {error}</div>
          )}

          <button type="submit" className="login-btn" disabled={isLoading}>
            {isLoading ? 'מתחבר...' : 'התחבר'}
          </button>
        </form>

        <div className="login-footer">
          <p>
            אין לך חשבון עדיין?{' '}
            <span onClick={() => setShowRegister(true)} className="auth-link">
              הירשם עכשיו
            </span>
          </p>
          <p>
            <span onClick={() => setShowForgot(true)} className="auth-link">
              שכחתי סיסמה
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;

