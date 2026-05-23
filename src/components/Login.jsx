import React, { useState } from 'react';
import './Login.css';

function Login({ onLoginSuccess }) {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('שם משתמש או סיסמה שגויים');
      }

      const data = await response.json();
      
      // שמור Token
      localStorage.setItem('token', data.token);
      localStorage.setItem('username', formData.username);
      
      // הודע להורה שהתחברנו
      onLoginSuccess();
      
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

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
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="הזן סיסמה"
              required
            />
          </div>

          {error && (
            <div className="error-message">
              ⚠️ {error}
            </div>
          )}

          <button type="submit" className="login-btn" disabled={isLoading}>
            {isLoading ? 'מתחבר...' : 'התחבר'}
          </button>
        </form>

        <div className="login-footer">
          <p>פרטי התחברות לבדיקה:</p>
          <p style={{ fontSize: '0.9em', color: '#666' }}>
            משתמש: <strong>nissim</strong> | סיסמה: <strong>Nissim123!</strong>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;