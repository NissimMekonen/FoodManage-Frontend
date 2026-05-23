import React, { useState, useEffect } from 'react';
import './Inventory.css';
import { createProduct, updateProduct, deleteProduct } from '../api';

const CATEGORIES = [
  { id: 'all', name: 'הכל' },
  { id: 'dairy', name: 'מוצרי חלב' },
  { id: 'meat', name: 'בשר ודגים' },
  { id: 'dry', name: 'יבשים וקטניות' },
  { id: 'veg', name: 'ירקות ופירות' },
  { id: 'drinks', name: 'שתייה' },
  { id: 'other', name: 'אחר' }
];

function Inventory({ inventory, setInventory, suppliers, updateQuantity }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [bulkInputs, setBulkInputs] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    quantity: '',
    unit: "ק''ג",
    minQuantity: '',
    category: 'dairy',
    supplierId: suppliers[0]?.id || ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // ✅ שלח ל-Backend
      const newProduct = await createProduct({
        name: formData.name,
        category: formData.category,
        quantity: parseFloat(formData.quantity),
        expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // +90 ימים
        alertBeforeDays: 7
      });

      // ✅ הוסף ל-State
      const newItem = {
        id: newProduct.id,
        name: newProduct.name,
        quantity: newProduct.quantity,
        unit: formData.unit,
        minQuantity: parseFloat(formData.minQuantity) || 5,
        category: newProduct.category,
        supplierId: formData.supplierId
      };

      setInventory([...inventory, newItem]);
      setFormData({ ...formData, name: '', quantity: '', minQuantity: '' });
      alert('✅ המוצר נוסף בהצלחה!');
    } catch (err) {
      console.error('Error creating product:', err);
      alert('❌ שגיאה בהוספת מוצר: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkInputChange = (id, value) => {
    setBulkInputs({ ...bulkInputs, [id]: value });
  };

  const handleBulkUpdate = (id, isAddition) => {
    const inputValue = parseFloat(bulkInputs[id]);
    if (isNaN(inputValue) || inputValue <= 0) return;
    const amount = isAddition ? inputValue : -inputValue;
    updateQuantity(id, amount);
    setBulkInputs({ ...bulkInputs, [id]: '' });
  };

  const deleteItem = async (id, name) => {
    if (!window.confirm(`האם אתה בטוח שברצונך למחוק את "${name}" מהמלאי?`)) {
      return;
    }

    try {
      // ✅ מחק מ-Backend
      await deleteProduct(id);
      
      // ✅ מחק מ-State
      setInventory(inventory.filter(item => item.id !== id));
      alert('✅ המוצר נמחק בהצלחה!');
    } catch (err) {
      console.error('Error deleting product:', err);
      alert('❌ שגיאה במחיקת מוצר: ' + err.message);
    }
  };

  const filteredInventory = inventory.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="main-layout animate-fade-in">
      {/* צד ימין: טופס הוספה */}
      <section className="form-section">
        <h2>הוספת חומר גלם חדש</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>שם הפריט *</label>
            <input 
              type="text" 
              name="name" 
              value={formData.name} 
              onChange={handleChange} 
              placeholder="למשל: חומוס גרגירים" 
              required 
              disabled={isLoading}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>כמות נוכחית *</label>
              <input 
                type="number" 
                step="0.01" 
                name="quantity" 
                value={formData.quantity} 
                onChange={handleChange} 
                required 
                disabled={isLoading}
              />
            </div>
            <div className="form-group">
              <label>יחידת מידה</label>
              <select 
                name="unit" 
                value={formData.unit} 
                onChange={handleChange}
                disabled={isLoading}
              >
                <option value="ק''ג">ק"ג</option>
                <option value="ליטר">ליטר</option>
                <option value="יחידות">יחידות</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>קטגוריית מוצר</label>
              <select 
                name="category" 
                value={formData.category} 
                onChange={handleChange}
                disabled={isLoading}
              >
                {CATEGORIES.filter(cat => cat.id !== 'all').map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>ספק ברירת מחדל</label>
              <select 
                name="supplierId" 
                value={formData.supplierId} 
                onChange={handleChange}
                disabled={isLoading}
              >
                {suppliers.map(sup => (
                  <option key={sup.id} value={sup.id}>{sup.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>מלאי מינימום להתראה *</label>
            <input 
              type="number" 
              step="0.01" 
              name="minQuantity" 
              value={formData.minQuantity} 
              onChange={handleChange} 
              required 
              disabled={isLoading}
            />
          </div>

          <button type="submit" className="submit-btn" disabled={isLoading}>
            {isLoading ? 'מוסיף...' : 'הוסף למזווה'}
          </button>
        </form>
      </section>

      {/* צד שמאל: טבלה */}
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
            {searchTerm && <button className="clear-search-btn" onClick={() => setSearchTerm('')}>✕</button>}
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
                <th>ספק משויך</th>
                <th>כמות במלאי</th>
                <th>סטטוס</th>
                <th>עדכון מהיר</th>
                <th>עדכון מרוכז</th>
                <th>פעולות</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.length > 0 ? (
                filteredInventory.map((item) => {
                  const isLowStock = item.quantity <= item.minQuantity;
                  const catName = CATEGORIES.find(c => c.id === item.category)?.name || 'אחר';
                  const supName = suppliers.find(s => s.id === item.supplierId)?.name || 'ללא ספק';
                  
                  return (
                    <tr key={item.id} className={isLowStock ? "low-stock-row" : ""}>
                      <td><strong>{item.name}</strong></td>
                      <td><span className="table-category-tag">{catName}</span></td>
                      <td><span className="table-supplier-tag">{supName}</span></td>
                      <td>{item.quantity} {item.unit}</td>
                      <td>
                        <span className={`badge ${isLowStock ? "danger" : "success"}`}>
                          {isLowStock ? "חסר!" : "תקין"}
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
                        <button className="delete-btn" onClick={() => deleteItem(item.id, item.name)}>🗑️</button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan="8" style={{ textAlign: 'center', color: '#888', padding: '35px' }}>לא נמצאו חומרי גלם מתאימים</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default Inventory;