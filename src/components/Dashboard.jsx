import React, { useMemo } from 'react';
import './styles/dashboard.css';
import {
  PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid
} from 'recharts';

const CATEGORIES = {
  dairy:  'מוצרי חלב',
  meat:   'בשר ודגים',
  dry:    'יבשים וקטניות',
  veg:    'ירקות ופירות',
  drinks: 'שתייה',
  other:  'אחר'
};

const CAT_COLORS = ['#16a085', '#2980b9', '#f39c12', '#e74c3c', '#8e44ad', '#95a5a6'];

function Dashboard({ setCurrentScreen, lowStockCount, isAdmin, inventory = [], suppliers = [], dishes = [] }) {

  const stats = useMemo(() => {
    const catMap = {};
    inventory.forEach(item => {
      const label = CATEGORIES[item.category] || 'אחר';
      catMap[label] = (catMap[label] || 0) + 1;
    });
    const categoryData = Object.entries(catMap).map(([name, value]) => ({ name, value }));

    const ingMap = {};
    dishes.forEach(dish => {
      (dish.ingredients || []).forEach(ing => {
        const key = ing.name?.trim();
        if (!key) return;
        if (!ingMap[key]) ingMap[key] = { name: key, count: 0 };
        ingMap[key].count += 1;
      });
    });
    const topIngredients = Object.values(ingMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
      .map(ing => ({ name: ing.name, 'מספר מנות': ing.count }));

    const outOfStock = inventory.filter(i => i.quantity === 0).length;

    return { categoryData, topIngredients, outOfStock };
  }, [inventory, dishes]);

  const hasData = inventory.length > 0 || dishes.length > 0;

  return (
    <div className="dashboard-container animate-fade-in">
      {/* Metric cards */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">פריטים במלאי</span>
            <i className="bi bi-box-seam-fill metric-icon"></i>
          </div>
          <div className="metric-number">{inventory.length}</div>
          <div className="metric-sub">
            {stats.outOfStock > 0 ? `${stats.outOfStock} אזלו מהמלאי` : 'מלאי תקין'}
          </div>
        </div>

        <div className={`metric-card${lowStockCount > 0 ? ' metric-danger' : ''}`}>
          <div className="metric-header">
            <span className="metric-label">התראות מלאי</span>
            <i className={`bi bi-exclamation-triangle-fill metric-icon${lowStockCount > 0 ? ' metric-icon-danger' : ''}`}></i>
          </div>
          <div className={`metric-number${lowStockCount > 0 ? ' metric-number-danger' : ''}`}>{lowStockCount}</div>
          <div className="metric-sub">{lowStockCount > 0 ? 'חוסרים / פגי תוקף' : 'הכל תקין'}</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">מנות בתפריט</span>
            <i className="bi bi-journal-richtext metric-icon"></i>
          </div>
          <div className="metric-number">{dishes.length}</div>
          <div className="metric-sub">{dishes.length > 0 ? 'עם מרכיבים מוגדרים' : 'ממתין למרכיבים'}</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">ספקים פעילים</span>
            <i className="bi bi-truck metric-icon"></i>
          </div>
          <div className="metric-number">{suppliers.length}</div>
          <div className="metric-sub">ספקים במערכת</div>
        </div>
      </div>

      {/* Image cards */}
      <div className="dashboard-grid">
        <div className="dash-card" onClick={() => setCurrentScreen('inventory')}>
          <div className="dash-card-img" style={{backgroundImage: "url('https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=800&q=80')"}} />
          <div className="dash-card-overlay" />
          <div className="dash-card-content">
            {lowStockCount > 0 && <span className="dash-badge-alert">⚠ {lowStockCount} התראות</span>}
            <h3>ניהול מלאי ומחסן</h3>
            <p>עדכון חומרי גלם, כמויות מרוכזות ומעקב חוסרים.</p>
            <span className="dash-card-btn">פתח ←</span>
          </div>
        </div>

        <div className="dash-card" onClick={() => setCurrentScreen('suppliers')}>
          <div className="dash-card-img" style={{backgroundImage: "url('https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80')"}} />
          <div className="dash-card-overlay" />
          <div className="dash-card-content">
            <h3>ניהול ספקים והזמנות רכש</h3>
            <p>אנשי קשר, ימי חלוקה ומחולל הזמנות חוסרים אוטומטי.</p>
            <span className="dash-card-btn">פתח ←</span>
          </div>
        </div>

        <div className="dash-card" onClick={() => setCurrentScreen('menu')}>
          <div className="dash-card-img" style={{backgroundImage: "url('https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=80')"}} />
          <div className="dash-card-overlay" />
          <div className="dash-card-content">
            <h3>תפריט שבועי</h3>
            <p>תכנון ארוחות לפי ימים, מעקב מרכיבים וחוסרים במלאי.</p>
            <span className="dash-card-btn">פתח ←</span>
          </div>
        </div>

        <div className={`dash-card${!isAdmin ? ' card-locked' : ''}`} onClick={() => isAdmin && setCurrentScreen('team')}>
          <div className="dash-card-img" style={{backgroundImage: "url('https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=800&q=80')"}} />
          <div className="dash-card-overlay" />
          <div className="dash-card-content">
            {!isAdmin && <span className="dash-badge-locked">🔒 מנהלים בלבד</span>}
            <h3>ניהול צוות</h3>
            <p>הוספת עובדים, ניהול הרשאות וצפייה בכלל אנשי הצוות.</p>
            {isAdmin && <span className="dash-card-btn">פתח ←</span>}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="stats-section">
        {!hasData ? (
          <div className="stats-empty">הוסף מוצרים ומנות כדי לראות סטטיסטיקות</div>
        ) : (
          <div className="stats-charts">

            {stats.categoryData.length > 0 && (
              <div className="stat-card">
                <h3>התפלגות מלאי לפי קטגוריה</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={stats.categoryData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={75}
                    >
                      {stats.categoryData.map((_, i) => (
                        <Cell key={i} fill={CAT_COLORS[i % CAT_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => [`${v} פריטים`]} />
                    <Legend iconSize={10} wrapperStyle={{ fontSize: '0.75rem' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="stat-card">
              <h3>רכיבים מובילים בשימוש</h3>
              {stats.topIngredients.length > 0 ? (
                <div dir="ltr">
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={stats.topIngredients} layout="vertical" margin={{ right: 16, left: 0, top: 4, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                      <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                      <Tooltip />
                      <Bar dataKey="מספר מנות" fill="#e9c176" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="stat-card-empty">הוסף מנות עם מרכיבים בתפריט השבועי</div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
