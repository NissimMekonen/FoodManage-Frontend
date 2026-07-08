import React, { useState } from 'react';
import './styles/auth.css';
import { AuthThemeToggle } from './Login';

function ForgotPassword({ onBack, theme, toggleTheme }) {
  const [formData, setFormData] = useState({ username: '', email: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:5148/api/Auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (!res.ok) throw new Error();
      setSent(true);
    } catch {
      setError('שגיאה בשליחת המייל — בדוק את הפרטים ונסה שוב');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <AuthThemeToggle theme={theme} toggleTheme={toggleTheme} />
      <div className="login-box">
        <div className="login-header">
          <h1>FoodManage</h1>
          <p>איפוס סיסמה</p>
        </div>

        {sent ? (
          <div>
            <div className="error-message error-message--success">
              ✅ אם הפרטים נכונים, נשלח אליך מייל עם קישור לאיפוס הסיסמה.
            </div>
            <button className="login-btn login-btn--mt" onClick={onBack}>
              חזור להתחברות
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label>שם משתמש</label>
              <input
                type="text"
                value={formData.username}
                onChange={e => setFormData(p => ({ ...p, username: e.target.value }))}
                placeholder="שם המשתמש שלך"
                required
                autoFocus
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label>אימייל</label>
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                placeholder="האימייל שרשמת בהרשמה"
                required
                disabled={isLoading}
              />
            </div>

            {error && <div className="error-message">⚠️ {error}</div>}

            <button type="submit" className="login-btn" disabled={isLoading}>
              {isLoading ? 'שולח...' : 'שלח קישור לאיפוס'}
            </button>
          </form>
        )}

        <div className="login-footer">
          <span
            onClick={onBack}
            className="auth-link"
          >
            ← חזור להתחברות
          </span>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
