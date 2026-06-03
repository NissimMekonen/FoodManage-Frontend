import React from 'react';

const rules = [
  { label: 'לפחות 8 תווים',           test: (p) => p.length >= 8 },
  { label: 'אות גדולה באנגלית (A-Z)', test: (p) => /[A-Z]/.test(p) },
  { label: 'אות קטנה באנגלית (a-z)', test: (p) => /[a-z]/.test(p) },
  { label: 'מספר (0-9)',              test: (p) => /[0-9]/.test(p) },
  { label: 'סימן מיוחד (!@#$...)',    test: (p) => /[^A-Za-z0-9]/.test(p) },
];

export const validatePassword = (password) => rules.every(r => r.test(password));

function PasswordStrength({ password }) {
  if (!password) return null;
  const passed = rules.filter(r => r.test(password)).length;
  const color = passed <= 2 ? '#e53935' : passed <= 3 ? '#fb8c00' : passed === 4 ? '#fdd835' : '#43a047';

  return (
    <div className="strength-wrap">
      <div className="strength-bars">
        {rules.map((_, i) => (
          <div key={i} className="strength-bar" style={{ background: i < passed ? color : '#e0e0e0' }} />
        ))}
      </div>
      <div className="strength-rules">
        {rules.map((rule, i) => (
          <div key={i} className="strength-rule" style={{ color: rule.test(password) ? '#43a047' : '#999' }}>
            <span>{rule.test(password) ? '✓' : '○'}</span>
            <span>{rule.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PasswordStrength;
