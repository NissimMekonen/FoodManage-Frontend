import React from 'react';
import './styles/sidebar.css';

const NAV_ITEMS = [
  { key: 'dashboard', label: 'לוח הבקרה',   icon: 'bi-grid-fill' },
  { key: 'inventory', label: 'ניהול מלאי',   icon: 'bi-box-seam-fill' },
  { key: 'suppliers', label: 'ספקים',         icon: 'bi-truck' },
  { key: 'menu',      label: 'תפריט שבועי',  icon: 'bi-journal-richtext' },
  { key: 'team',      label: 'ניהול צוות',   icon: 'bi-people-fill', adminOnly: true },
];

function Sidebar({ currentScreen, navigate, handleLogout, isAdmin, lowStockCount, setShowChangePassword, isOpen, onClose, businessName }) {
  const username = sessionStorage.getItem('username');

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
      <aside className={`sidebar${isOpen ? ' open' : ''}`}>

        <div className="sidebar-profile">
          <div className="sidebar-profile-name">{username || 'FoodManage'}</div>
          <div className="sidebar-profile-role">{businessName || (isAdmin ? 'מנהל מטבח' : 'צוות מטבח')}</div>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map(item => {
            if (item.adminOnly && !isAdmin) return null;
            return (
              <button
                key={item.key}
                className={`sidebar-item${currentScreen === item.key ? ' active' : ''}`}
                onClick={() => navigate(item.key)}
              >
                <i className={`bi ${item.icon}`}></i>
                <span>{item.label}</span>
                {item.key === 'inventory' && lowStockCount > 0 && (
                  <span className="sidebar-badge">{lowStockCount}</span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <i className="bi bi-person-circle"></i>
            <span>{username}</span>
          </div>
          <button className="sidebar-settings-btn" onClick={() => setShowChangePassword(true)} title="שינוי סיסמה">
            <i className="bi bi-lock-fill"></i>
          </button>
          <button className="sidebar-logout" onClick={handleLogout} title="התנתק">
            <i className="bi bi-box-arrow-right"></i>
          </button>
        </div>

      </aside>
    </>
  );
}

export default Sidebar;
