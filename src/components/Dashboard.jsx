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

    const supMap = {};
    inventory.forEach(item => {
      if (!item.supplierId) return;
      const sup = suppliers.find(s => String(s.id) === String(item.supplierId));
      const name = sup?.name || 'לא ידוע';
      supMap[name] = (supMap[name] || 0) + 1;
    });
    const supplierData = Object.entries(supMap)
      .map(([name, count]) => ({ name, 'מוצרים': count }))
      .sort((a, b) => b['מוצרים'] - a['מוצרים'])
      .slice(0, 5);

    const outOfStock = inventory.filter(i => i.quantity === 0).length;

    return { categoryData, topIngredients, supplierData, outOfStock };
  }, [inventory, dishes, suppliers]);

  const hasMenu = dishes.some(d => d.ingredients?.length > 0);
  const hasData  = inventory.length > 0 || dishes.length > 0;

  return (
    <div className="dashboard-container animate-fade-in">
      <div className="welcome-message">
        <h2>ברוך הבא למטבח שלך 👋</h2>
      </div>

      <div className="dashboard-grid">
        <div className="dash-card card-inventory" onClick={() => setCurrentScreen('inventory')}>
          <div className="card-icon">📦</div>
          <h3>ניהול מלאי ומחסן</h3>
          <p>עדכון חומרי גלם, כמויות מרוכזות ומעקב חוסרים.</p>
          {lowStockCount > 0 && <span className="dash-badge-alert">יש {lowStockCount} חוסרים</span>}
        </div>

        <div className="dash-card card-suppliers" onClick={() => setCurrentScreen('suppliers')}>
          <div className="card-icon">🚚</div>
          <h3>ניהול ספקים והזמנות רכש</h3>
          <p>אנשי קשר, ימי חלוקה ומחולל הזמנות חוסרים אוטומטי ספציפי לספק.</p>
        </div>

        <div className="dash-card card-menus" onClick={() => setCurrentScreen('menu')}>
          <div className="card-icon">🍳</div>
          <h3>תפריט שבועי</h3>
          <p>תכנון ארוחות לפי ימים, מעקב מרכיבים וחוסרים במלאי.</p>
        </div>

        {isAdmin ? (
          <div className="dash-card card-team" onClick={() => setCurrentScreen('team')}>
            <div className="card-icon">👥</div>
            <h3>ניהול צוות</h3>
            <p>הוספת עובדים, ניהול הרשאות וצפייה בכלל אנשי הצוות.</p>
          </div>
        ) : (
          <div className="dash-card card-team card-locked">
            <div className="card-icon">🔒</div>
            <h3>ניהול צוות</h3>
            <p>גישה למנהלים בלבד</p>
          </div>
        )}
      </div>

      {/* סטטיסטיקות */}
      <div className="stats-section">
        <h2 className="stats-title">📊 סטטיסטיקות</h2>

        <div className="stats-pills">
          <div className="stat-pill">
            <span className="stat-pill-num">{inventory.length}</span>
            <span className="stat-pill-label">פריטים במלאי</span>
          </div>
          <div className={`stat-pill ${lowStockCount > 0 ? 'pill-warn' : ''}`}>
            <span className="stat-pill-num">{lowStockCount}</span>
            <span className="stat-pill-label">חוסרים</span>
          </div>
          <div className={`stat-pill ${stats.outOfStock > 0 ? 'pill-danger' : ''}`}>
            <span className="stat-pill-num">{stats.outOfStock}</span>
            <span className="stat-pill-label">אזל מהמלאי</span>
          </div>
          <div className="stat-pill">
            <span className="stat-pill-num">{dishes.length}</span>
            <span className="stat-pill-label">מנות בתפריט</span>
          </div>
          <div className="stat-pill">
            <span className="stat-pill-num">{suppliers.length}</span>
            <span className="stat-pill-label">ספקים פעילים</span>
          </div>
        </div>

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

            {hasMenu && stats.topIngredients.length > 0 && (
              <div className="stat-card">
                <h3>מרכיבים נפוצים בתפריט</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={stats.topIngredients} layout="vertical" margin={{ right: 16, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" width={85} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="מספר מנות" fill="#16a085" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {stats.supplierData.length > 0 && (
              <div className="stat-card">
                <h3>מוצרים לפי ספק</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={stats.supplierData} margin={{ bottom: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="מוצרים" fill="#2980b9" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
