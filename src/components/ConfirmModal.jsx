import React from 'react';
import './styles/confirm-modal.css';

function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, confirmText = 'מחק' }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-box confirm-modal-box" onClick={e => e.stopPropagation()}>
        <div className="confirm-icon">🗑️</div>
        <h3 className="confirm-title">{title}</h3>
        <p className="confirm-message">{message}</p>
        <div className="confirm-actions">
          <button className="confirm-cancel-btn" onClick={onCancel}>ביטול</button>
          <button className="confirm-delete-btn" onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
