import React, { useState } from 'react';
import './styles/auth.css';
import PasswordStrength, { validatePassword } from './PasswordStrength';
import PasswordInput from './PasswordInput';
import { AuthThemeToggle } from './Login';

function ResetPassword({ token, onDone, theme, toggleTheme }) {
  const [formData, setFormData] = useState({ newPassword: '', confirmPassword: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validatePassword(formData.newPassword)) {
      setError('הסיסמה לא עומדת בדרישות החוזק');
      return;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      setError('הסיסמאות אינן תואמות');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('http://localhost:5148/api/Auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: formData.newPassword })
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || 'שגיאה');
      }
      setSuccess(true);
      window.history.replaceState({}, '', '/');
    } catch (err) {
      setError(err.message.includes('תקף') ? err.message : 'הקישור לא תקף או פג תוקפו');
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
          <p>הגדרת סיסמה חדשה</p>
        </div>

        {success ? (
          <div>
            <div className="error-message error-message--success">
              ✅ הסיסמה שונתה בהצלחה!
            </div>
            <button className="login-btn login-btn--mt" onClick={onDone}>
              כניסה למערכת
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label>סיסמה חדשה</label>
              <PasswordInput
                name="newPassword"
                value={formData.newPassword}
                onChange={e => setFormData(p => ({ ...p, newPassword: e.target.value }))}
                placeholder="סיסמה חזקה"
                required
                disabled={isLoading}
              />
              <PasswordStrength password={formData.newPassword} />
            </div>

            <div className="form-group">
              <label>אימות סיסמה</label>
              <PasswordInput
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={e => setFormData(p => ({ ...p, confirmPassword: e.target.value }))}
                placeholder="הכנס סיסמה שוב"
                required
                disabled={isLoading}
              />
            </div>

            {error && <div className="error-message">⚠️ {error}</div>}

            <button type="submit" className="login-btn" disabled={isLoading}>
              {isLoading ? 'שומר...' : 'שמור סיסמה חדשה'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default ResetPassword;
