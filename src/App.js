import React, { useState, useEffect } from 'react';
import './App.css';

// רשימת הקטגוריות הקבועות במטבח שלך
const CATEGORIES = [
  { id: 'all', name: 'הכל' },
  { id: 'dairy', name: 'מוצרי חלב' },
  { id: 'meat', name: 'בשר ודגים' },
  { id: 'dry', name: 'יבשים וקטניות' },
  { id: 'veg', name: 'ירקות ופירות' },
  { id: 'drinks', name: 'שתייה' },
  { id: 'other', name: 'אחר' }
];

function App() {
  // סטייט חדש לניווט בין מסכים: 'dashboard' (מסך קוביות), 'inventory', 'suppliers', 'menus'
  const [currentScreen, setCurrentScreen] = useState('dashboard');

  // 1. טעינת המידע מהזיכרון
  const [inventory, setInventory] = useState(() => {
    const savedInventory = localStorage.getItem('kitchen_inventory');
    if (savedInventory) {
      return JSON.parse(savedInventory);
    } else {
      return [
        { id: 1, name: 'קמח לבן', quantity: 15, unit: "ק''ג", minQuantity: 5, category: 'dry' },
        { id: 2, name: 'חמאה', quantity: 2, unit: "ק''ג", minQuantity: 3, category: 'dairy' },
        { id: 3, name: 'סוכר לבן', quantity: 8, unit: "ק''ג", minQuantity: 4, category: 'dry' },
        { id: 4, name: 'שוקולד מריר 60%', quantity: 1.5, unit: "ק''ג", minQuantity: 2, category: 'dry' }
      ];
    }
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [bulkInputs, setBulkInputs] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    quantity: '',
    unit: "ק''ג",
    minQuantity: '',
    category: 'dairy'
  });

  // אפקט לשמירה אוטומטית בזיכרון של הדפדפן
  useEffect(() => {
    localStorage.setItem('kitchen_inventory', JSON.stringify(inventory));
  }, [inventory]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newItem = {
      id: Date.now(),
      name: formData.name,
      quantity: parseFloat(formData.quantity),
      unit: formData.unit,
      minQuantity: parseFloat(formData.minQuantity),
      category: formData.category
    };
    setInventory([...inventory, newItem]);
    setFormData({ name: '', quantity: '', unit: "ק''ג", minQuantity: '', category: formData.category });
  };

  const updateQuantity = (id, amount) => {
    setInventory(inventory.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, item.quantity + amount);
        return { ...item, quantity: Number(newQty.toFixed(2)) };
      }
      return item;
    }));
  };

  const handleBulkUpdate = (id, isAddition) => {
    const inputValue = parseFloat(bulkInputs[id]);
    if (isNaN(inputValue) || inputValue <= 0) return;
    const amount = isAddition ? inputValue : -inputValue;
    updateQuantity(id, amount);
    setBulkInputs({ ...bulkInputs, [id]: '' });
  };

  const handleBulkInputChange = (id, value) => {
    setBulkInputs({ ...bulkInputs, [id]: value });
  };

  const deleteItem = (id, name) => {
    if (window.confirm(`האם אתה בטוח שברצונך למחוק את "${name}" מהמלאי?`)) {
      setInventory(inventory.filter(item => item.id !== id));
    }
  };

  const filteredInventory = inventory.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // חישוב כמות המוצרים החסרים כדי להציג התראה על הקובייה
  const lowStockCount = inventory.filter(item => item.quantity <= item.minQuantity).length;

  return (
    <div className="App">
      <header className="App-header">
        <div className="header-content">
          <h1>FoodManage 🍰 - מערכת ניהול מטבח</h1>
          {currentScreen !== 'dashboard' && (
            <button className="back-to-dash-btn" onClick={() => setCurrentScreen('dashboard')}>
              🏠 חזור לתפריט הראשי
            </button>
          )}
        </div>
      </header>

      {/* מסך 1: לוח קוביות ראשי (Dashboard) */}
      {currentScreen === 'dashboard' && (
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
              {lowStockCount > 0 && (
                <span className="dash-badge-alert">יש {lowStockCount} חוסרים</span>
              )}
            </div>

            {/* קוביית ספקים */}
            <div className="dash-card card-suppliers" onClick={() => setCurrentScreen('suppliers')}>
              <div className="card-icon">🚚</div>
              <h3>ניהול ספקים</h3>
              <p>אנשי קשר, ימי חלוקה, טלפונים והזמנות רכש.</p>
              <span className="dash-badge-coming">בקרוב</span>
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
      )}

      {/* מסך 2: חלון המלאי המקורי והמוכר שלך */}
      {currentScreen === 'inventory' && (
        <div className="main-layout animate-fade-in">
          {/* צד ימין: טופס הוספת חומר גלם */}
          <section className="form-section">
            <h2>הוספת חומר גלם חדש</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>שם הפריט *</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="למשל: חומוס גרגירים" required />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>כמות נוכחית *</label>
                  <input type="number" step="0.01" name="quantity" value={formData.quantity} onChange={handleChange} required />
                </div>
                
                <div className="form-group">
                  <label>יחידת מידה</label>
                  <select name="unit" value={formData.unit} onChange={handleChange}>
                    <option value="ק''ג">ק"ג</option>
                    <option value="ליטר">ליטר</option>
                    <option value="יחידות">יחידות</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>קטגוריית מוצר</label>
                <select name="category" value={formData.category} onChange={handleChange}>
                  {CATEGORIES.filter(cat => cat.id !== 'all').map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>מלאי מינימום להתראה *</label>
                <input type="number" step="0.01" name="minQuantity" value={formData.minQuantity} onChange={handleChange} placeholder="מתחת לכמות זו הפריט ייצבע באדום" required />
              </div>

              <button type="submit" className="submit-btn">הוסף למזווה</button>
            </form>
          </section>

          {/* צד שמאל: טבלת המלאי הנוכחי */}
          <section className="table-section">
            <div className="table-header-container">
              <h2>המזווה שלך (חומרי גלם)</h2>
              
              <div className="search-container">
                <span className="search-icon">🔍</span>
                <input 
                  type="text" 
                  className="modern-search-input"
                  placeholder="חפש חומר גלם..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                />
                {searchTerm && (
                  <button className="clear-search-btn" onClick={() => setSearchTerm('')}>✕</button>
                )}
              </div>
            </div>

            <div className="categories-filter-bar">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  className={`category-tab-btn ${selectedCategory === cat.id ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>שם חומר הגלם</th>
                    <th>קטגוריה</th>
                    <th>כמות במלאי</th>
                    <th>סטטוס מלאי</th>
                    <th>עדכון כמות מהיר</th>
                    <th>עדכון סחורה / מרוכז</th>
                    <th>פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInventory.length > 0 ? (
                    filteredInventory.map((item) => {
                      const isLowStock = item.quantity <= item.minQuantity;
                      const catName = CATEGORIES.find(c => c.id === item.category)?.name || 'אחר';
                      
                      return (
                        <tr key={item.id} className={isLowStock ? "low-stock-row" : ""}>
                          <td><strong>{item.name}</strong></td>
                          <td><span className="table-category-tag">{catName}</span></td>
                          <td>{item.quantity} {item.unit}</td>
                          <td>
                            <span className={`badge ${isLowStock ? "danger" : "success"}`}>
                              {isLowStock ? "חסר / להזמין!" : "תקין"}
                            </span>
                          </td>
                          
                          <td>
                            <button className="qty-btn plus" onClick={() => updateQuantity(item.id, 1)}>+1</button>
                            <button className="qty-btn minus" onClick={() => updateQuantity(item.id, -1)}>-1</button>
                          </td>

                          <td>
                            <div className="bulk-update-container">
                              <input 
                                type="number" 
                                placeholder="כמות..." 
                                className="table-input"
                                value={bulkInputs[item.id] || ''}
                                onChange={(e) => handleBulkInputChange(item.id, e.target.value)}
                                min="0"
                                step="0.01"
                              />
                              <button className="bulk-btn bulk-plus" onClick={() => handleBulkUpdate(item.id, true)}>+</button>
                              <button className="bulk-btn bulk-minus" onClick={() => handleBulkUpdate(item.id, false)}>-</button>
                            </div>
                          </td>

                          <td>
                            <button className="delete-btn" onClick={() => deleteItem(item.id, item.name)} title="מחק מוצר מהמלאי">🗑️</button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', color: '#888', padding: '35px' }}>
                        לא נמצאו חומרי גלם בקטגוריה זו המתאימים לחיפוש שלך
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {/* מסך 3: חלון ספקים זמני */}
      {currentScreen === 'suppliers' && (
        <div className="placeholder-screen animate-fade-in">
          <div className="placeholder-card">
            <h2>🚚 מערך ניהול ספקים</h2>
            <p>כאן תוכל לנהל את רשימת הספקים, טלפונים, וימי חלוקה מוגדרים מראש.</p>
            <p className="status-note">המודול נמצא בשלבי פיתוח ויחובר בקרוב לחוסרי המלאי שלך!</p>
          </div>
        </div>
      )}

      {/* מסך 4: חלון תפריטים זמני */}
      {currentScreen === 'menus' && (
        <div className="placeholder-screen animate-fade-in">
          <div className="placeholder-card">
            <h2>🍳 תפריטים ועצי מוצר</h2>
            <p>כאן נבנה בעתיד את המתכונים של המנות (רספיז). המערכת תדע להוריד אוטומטית חומרי גלם מהמלאי בכל פעם שתכין מנה!</p>
            <p className="status-note">המודול נמצא בשלבי תכנון.</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;