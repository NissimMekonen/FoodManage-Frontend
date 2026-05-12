import React from 'react';
import './Dashboard.css';

function Dashboard({ setCurrentScreen, lowStockCount }) {
  return (
    <div className="dashboard-container animate-fade-in">
      <div className="welcome-message">
        <h2>ברוך הבא למטבח שלך 👋</h2>
        <p>בחר לאיזה מודול ברצונך להיכנס:</p>
      </div>
      
      <div className="dashboard-grid">
        {/* קוביית מלאי */}
        <div className="dash-card card-inventory" onClick={() => setCurrentScreen('inventory')}>
          <div className="card-icon">📦</div>
          <h3>ניהול מלאי ומחסן</h3>
          <p>עדכון חומרי גלם, כמויות מרוכזות ומעקב חוסרים.</p>
          {lowStockCount > 0 && <span className="dash-badge-alert">יש {lowStockCount} חוסרים</span>}
        </div>

        {/* קוביית ספקים */}
        <div className="dash-card card-suppliers" onClick={() => setCurrentScreen('suppliers')}>
          <div className="card-icon">🚚</div>
          <h3>ניהול ספקים והזמנות רכש</h3>
          <p>אנשי קשר, ימי חלוקה ומחולל הזמנות חוסרים אוטומטי ספציפי לספק.</p>
        </div>

        {/* קוביית תפריטים */}
        <div className="dash-card card-menus" onClick={() => setCurrentScreen('menus')}>
          <div className="card-icon">🍳</div>
          <h3>תפריטים ומנות</h3>
          <p>בניית מנות, עצי מוצר (רספיז) וחישוב עלויות חומרי גלם.</p>
          <span className="dash-badge-coming">בקרוב</span>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;