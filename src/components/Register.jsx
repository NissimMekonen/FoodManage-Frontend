import React, { useState } from 'react';
import './styles/auth.css';
import { register } from '../api';
import PasswordStrength, { validatePassword } from './PasswordStrength';
import PasswordInput from './PasswordInput';

function Register({ onRegisterSuccess, onBackToLogin }) {
  const [formData, setFormData] = useState({
    businessName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validatePassword(formData.password)) {
      setError('הסיסמה לא עומדת בדרישות החוזק');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('הסיסמאות אינן תואמות');
      return;
    }

    setIsLoading(true);

    try {
      await register(formData.businessName, formData.username, formData.email, formData.password);
      onRegisterSuccess();
    } catch (err) {
      setError('שגיאה בהרשמה — ייתכן ששם המשתמש כבר קיים');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box login-box--wide">
        <div className="login-header">
          <h1>🍳 FoodManage</h1>
          <p>יצירת חשבון חדש</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>שם העסק *</label>
            <input
              type="text"
              name="businessName"
              value={formData.businessName}
              onChange={handleChange}
              placeholder="למשל: מסעדת הגינה"
              required
              autoFocus
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label>שם משתמש *</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="שם משתמש לכניסה למערכת"
              required
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label>אימייל *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your@email.com"
              required
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label>סיסמה *</label>
            <PasswordInput
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="סיסמה חזקה"
              required
              disabled={isLoading}
            />
            <PasswordStrength password={formData.password} />
          </div>

          <div className="form-group">
            <label>אימות סיסמה *</label>
            <PasswordInput
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="הכנס סיסמה שוב"
              required
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="error-message">⚠️ {error}</div>
          )}

          <button type="submit" className="login-btn" disabled={isLoading}>
            {isLoading ? 'יוצר חשבון...' : 'צור חשבון'}
          </button>
        </form>

        <div className="login-footer">
          <p>כבר יש לך חשבון?{' '}
            <span
              onClick={onBackToLogin}
              className="auth-link"
            >
              התחבר
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;

