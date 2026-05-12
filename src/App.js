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
  // 1. טעינת המידע מהזיכרון, כולל שדה קטגוריה למוצרים הקיימים
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

  // 2. סטייט עבור מילת החיפוש
  const [searchTerm, setSearchTerm] = useState('');

  // 3. סטייט חדש: הקטגוריה שנבחרה כרגע לסינון בטבלה (ברירת מחדל: "הכל")
  const [selectedCategory, setSelectedCategory] = useState('all');

  // 4. סטייט עבור כמויות שהמשתמש מקליד בתיבות העדכון בטבלה
  const [bulkInputs, setBulkInputs] = useState({});

  // 5. סטייט עבור טופס הוספת חומר גלם (הוספנו שדה category)
  const [formData, setFormData] = useState({
    name: '',
    quantity: '',
    unit: "ק''ג",
    minQuantity: '',
    category: 'dairy' // ברירת מחדל בטופס
  });

  // אפקט לשמירה אוטומטית בזיכרון של הדפדפן
  useEffect(() => {
    localStorage.setItem('kitchen_inventory', JSON.stringify(inventory));
  }, [inventory]);

  // עדכון הסטייט בכל הקלדה בטופס הימני
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // הוספת חומר גלם חדש למלאי
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
    // איפוס הטופס ושמירת הקטגוריה האחרונה כברירת מחדל
    setFormData({ name: '', quantity: '', unit: "ק''ג", minQuantity: '', category: formData.category });
  };

  // עדכון כמות מהיר (+1 / -1)
  const updateQuantity = (id, amount) => {
    setInventory(inventory.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, item.quantity + amount);
        return { ...item, quantity: Number(newQty.toFixed(2)) };
      }
      return item;
    }));
  };

  // עדכון כמות מרוכזת (כמו 700 קילו)
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

  // מחיקת פריט
  const deleteItem = (id, name) => {
    if (window.confirm(`האם אתה בטוח שברצונך למחוק את "${name}" מהמלאי?`)) {
      setInventory(inventory.filter(item => item.id !== id));
    }
  };

  // --- מנגנון הסינון המשולב (קטגוריות + חיפוש חופשי) ---
  const filteredInventory = inventory.filter(item => {
    // 1. סינון לפי קטגוריה
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    // 2. סינון לפי מילת חיפוש
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="App">
      <header className="App-header">
        <h1>FoodManage 🍰 - ניהול מלאי מטבח</h1>
      </header>

      <div className="main-layout">
        
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

            {/* שדה חדש בטופס: בחירת קטגוריה לשיוך */}
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

        {/* צד שמאל: טבלת המלאי הנוכחי + שורת חיפוש וסרגל קטגוריות */}
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

          {/* סרגל כפתורי קטגוריות אלגנטי וחדש */}
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
                    // מציאת השם של הקטגוריה בעברית להצגה בטבלה
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
                      لا נמצאו חומרי גלם בקטגוריה זו המתאימים לחיפוש שלך
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </div>
  );
}

export default App;