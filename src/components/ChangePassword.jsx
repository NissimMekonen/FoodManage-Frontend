import React, { useState } from 'react';
import './styles/auth.css';
import { changePassword } from '../api';
import PasswordStrength, { validatePassword } from './PasswordStrength';
import PasswordInput from './PasswordInput';

function ChangePassword({ onClose, showToast }) {
  const [formData, setFormData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validatePassword(formData.newPassword)) {
      setError('הסיסמה החדשה לא עומדת בדרישות החוזק');
      return;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      setError('הסיסמאות אינן תואמות');
      return;
    }

    setIsLoading(true);
    try {
      await changePassword(formData.currentPassword, formData.newPassword);
      showToast('הסיסמה שונתה בהצלחה!', 'success');
      onClose();
    } catch (err) {
      setError('הסיסמה הנוכחית שגויה');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="login-box">
        <div className="login-header">
          <h1>🔑 שינוי סיסמה</h1>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>סיסמה נוכחית</label>
            <PasswordInput name="currentPassword" value={formData.currentPassword} onChange={handleChange} required disabled={isLoading} placeholder="הכנס סיסמה נוכחית" />
          </div>

          <div className="form-group">
            <label>סיסמה חדשה</label>
            <PasswordInput name="newPassword" value={formData.newPassword} onChange={handleChange} required disabled={isLoading} placeholder="הכנס סיסמה חדשה" />
            <PasswordStrength password={formData.newPassword} />
          </div>

          <div className="form-group">
            <label>אימות סיסמה חדשה</label>
            <PasswordInput name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required disabled={isLoading} placeholder="הכנס סיסמה שוב" />
          </div>

          {error && <div className="error-message">⚠️ {error}</div>}

          <div className="login-btn-group">
            <button type="submit" className="login-btn" disabled={isLoading}>
              {isLoading ? 'שומר...' : 'שמור סיסמה'}
            </button>
            <button type="button" onClick={onClose} className="cancel-btn">
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ChangePassword;
