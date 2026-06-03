import React, { useState, useEffect } from 'react';
import './styles/team.css';
import { createUser, getUsers, deleteUser } from '../api';
import PasswordStrength, { validatePassword } from './PasswordStrength';
import PasswordInput from './PasswordInput';
import ConfirmModal from './ConfirmModal';

function TeamManagement({ showToast, currentUsername }) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'Employee'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [confirm, setConfirm] = useState({ open: false, title: '', message: '', onConfirm: null });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const data = await getUsers();
      setUsers(data);
    } catch {
      showToast('שגיאה בטעינת המשתמשים', 'error');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleDeleteUser = (user) => {
    setConfirm({
      open: true,
      title: 'פיטורי עובד',
      message: `האם למחוק את החשבון של "${user.username}"? פעולה זו אינה הפיכה.`,
      onConfirm: async () => {
        setConfirm(c => ({ ...c, open: false }));
        try {
          await deleteUser(user.id);
          setUsers(prev => prev.filter(u => u.id !== user.id));
          showToast(`החשבון של "${user.username}" נמחק בהצלחה`, 'success');
        } catch (err) {
          showToast('שגיאה במחיקת המשתמש: ' + err.message, 'error');
        }
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validatePassword(formData.password)) {
      showToast('הסיסמה לא עומדת בדרישות החוזק', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const newUser = await createUser(formData);
      setUsers(prev => [...prev, newUser]);
      setFormData({ username: '', email: '', password: '', role: 'Employee' });
      showToast(`המשתמש "${newUser.username}" נוצר בהצלחה!`, 'success');
    } catch {
      showToast('שגיאה ביצירת משתמש — ייתכן ששם המשתמש כבר קיים', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="main-layout animate-fade-in">
      <section className="form-section team-border">
        <h2>הוספת משתמש חדש</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>שם משתמש *</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="למשל: moshe"
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
              placeholder="moshe@restaurant.com"
              required
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label>סיסמה זמנית *</label>
            <PasswordInput
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="סיסמה חזקה לכניסה ראשונה"
              required
              disabled={isLoading}
            />
            <PasswordStrength password={formData.password} />
          </div>

          <div className="form-group">
            <label>תפקיד</label>
            <div className="role-selector">
              <div
                className={`role-card ${formData.role === 'Employee' ? 'active' : ''}`}
                onClick={() => setFormData({ ...formData, role: 'Employee' })}
              >
                <div className="role-icon">👤</div>
                <div className="role-name">עובד</div>
                <div className="role-desc">צפייה בלבד במלאי ובספקים</div>
              </div>
              <div
                className={`role-card ${formData.role === 'Admin' ? 'active' : ''}`}
                onClick={() => setFormData({ ...formData, role: 'Admin' })}
              >
                <div className="role-icon">👑</div>
                <div className="role-name">מנהל</div>
                <div className="role-desc">גישה מלאה לכל הפעולות</div>
              </div>
            </div>
          </div>

          <button type="submit" className="submit-btn team-btn" disabled={isLoading}>
            {isLoading ? 'יוצר משתמש...' : 'צור משתמש'}
          </button>
        </form>
      </section>

      <section className="table-section">
        <h2>צוות העסק</h2>
        {loadingUsers ? (
          <div className="team-placeholder">טוען משתמשים...</div>
        ) : users.length === 0 ? (
          <div className="team-placeholder">אין משתמשים רשומים</div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>שם משתמש</th>
                  <th>אימייל</th>
                  <th>תפקיד</th>
                  <th>פעולות</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isSelf = u.username === currentUsername;
                  return (
                    <tr key={u.id}>
                      <td><strong>{u.username}</strong>{isSelf && <span className="self-badge"> (אתה)</span>}</td>
                      <td>{u.email}</td>
                      <td>
                        <span className={`badge ${u.role === 'Admin' ? 'warning' : 'info'}`}>
                          {u.role === 'Admin' ? '👑 מנהל' : '👤 עובד'}
                        </span>
                      </td>
                      <td>
                        {!isSelf && (
                          <button className="delete-btn" onClick={() => handleDeleteUser(u)} title="מחק חשבון">🗑️</button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <ConfirmModal
        isOpen={confirm.open}
        title={confirm.title}
        message={confirm.message}
        onConfirm={confirm.onConfirm}
        onCancel={() => setConfirm(c => ({ ...c, open: false }))}
        confirmText="מחק חשבון"
      />
    </div>
  );
}

export default TeamManagement;
