import React, { useState, useEffect } from 'react';
import './styles/inventory.css';
import { createProduct, deleteProduct } from '../api';
import { findSupplierForCategory } from '../utils/assignSuppliers';
import ConfirmModal from './ConfirmModal';

const CATEGORIES = [
  { id: 'all', name: 'הכל' },
  { id: 'dairy', name: 'מוצרי חלב' },
  { id: 'meat', name: 'בשר ודגים' },
  { id: 'dry', name: 'יבשים וקטניות' },
  { id: 'veg', name: 'ירקות ופירות' },
  { id: 'drinks', name: 'שתייה' },
  { id: 'other', name: 'אחר' }
];

function Inventory({ inventory, setInventory, suppliers, updateQuantity, updateProductSupplier, showToast, isAdmin }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [bulkInputs, setBulkInputs] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [confirm, setConfirm] = useState({ open: false, title: '', message: '', onConfirm: null });
  const [formData, setFormData] = useState({
    name: '',
    quantity: '',
    unit: "ק''ג",
    minQuantity: '',
    category: 'dairy',
    supplierId: '',
    expiryDate: ''
  });

  useEffect(() => {
    if (suppliers.length > 0 && !formData.supplierId) {
      const preferred = findSupplierForCategory(suppliers, formData.category);
      setFormData(prev => ({
        ...prev,
        supplierId: String(preferred?.id || suppliers[0].id)
      }));
    }
  }, [suppliers]);

  // כשמשנים קטגוריה בטופס — עדכן ספק מומלץ
  useEffect(() => {
    if (suppliers.length === 0) return;
    const preferred = findSupplierForCategory(suppliers, formData.category);
    if (preferred) {
      setFormData(prev => ({ ...prev, supplierId: String(preferred.id) }));
    }
  }, [formData.category, suppliers]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const newProduct = await createProduct({
        name: formData.name,
        category: formData.category,
        quantity: parseFloat(formData.quantity),
        expiryDate: formData.expiryDate
          ? new Date(formData.expiryDate).toISOString()
          : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        alertBeforeDays: parseFloat(formData.minQuantity) || 5,
        supplierId: formData.supplierId || null
      });

      const newItem = {
        id: newProduct.id,
        name: newProduct.name,
        quantity: newProduct.quantity,
        unit: formData.unit,
        minQuantity: parseFloat(formData.minQuantity) || 5,
        category: newProduct.category,
        supplierId: formData.supplierId,
        expiryDate: newProduct.expiryDate ?? null
      };

      setInventory([...inventory, newItem]);
      setFormData({ ...formData, name: '', quantity: '', minQuantity: '', expiryDate: '' });
      showToast('המוצר נוסף בהצלחה!', 'success');
      setShowAddModal(false);
    } catch (err) {
      console.error('Error creating product:', err);
      showToast('שגיאה בהוספת מוצר: ' + err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkInputChange = (id, value) => {
    setBulkInputs({ ...bulkInputs, [id]: value });
  };

  const handleBulkUpdate = (id) => {
    const inputValue = parseFloat(bulkInputs[id]);
    if (isNaN(inputValue)) return;
    updateQuantity(id, inputValue);
    setBulkInputs({ ...bulkInputs, [id]: '' });
  };

  const deleteItem = (id, name) => {
    setConfirm({
      open: true,
      title: 'מחיקת מוצר',
      message: `האם למחוק את "${name}" מהמלאי?`,
      onConfirm: async () => {
        setConfirm(c => ({ ...c, open: false }));
        try {
          await deleteProduct(id);
          setInventory(inventory.filter(item => item.id !== id));
          showToast('המוצר נמחק בהצלחה!', 'success');
        } catch (err) {
          console.error('Error deleting product:', err);
          showToast('שגיאה במחיקת מוצר: ' + err.message, 'error');
        }
      }
    });
  };

  const filteredInventory = inventory.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="inventory-page animate-fade-in">
      <section className="table-section inventory-full">
        <div className="table-header-container">
          <h2>המזווה שלך (חומרי גלם)</h2>
          {isAdmin && (
            <button className="add-ingredient-btn" onClick={() => setShowAddModal(true)}>
              <i className="bi bi-plus-lg"></i>
              הוספת חומר גלם חדש
            </button>
          )}
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
                <th>מינימום</th>
                <th>סטטוס</th>
                <th>תאריך תפוגה</th>
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
                  const today = new Date(); today.setHours(0,0,0,0);
                  const expiry = item.expiryDate ? new Date(item.expiryDate) : null;
                  const daysLeft = expiry ? Math.ceil((expiry - today) / (1000 * 60 * 60 * 24)) : null;
                  const isExpired = daysLeft !== null && daysLeft < 0;
                  const isSoonExpiry = daysLeft !== null && daysLeft >= 0 && daysLeft <= 7;
                  return (
                    <tr key={item.id} className={isLowStock ? "low-stock-row" : ""}>
                      <td><strong>{item.name}</strong></td>
                      <td><span className="table-category-tag">{catName}</span></td>
                      <td>
                        {isAdmin && updateProductSupplier ? (
                          <select
                            className="table-supplier-select"
                            value={item.supplierId ? String(item.supplierId) : ''}
                            onChange={(e) => updateProductSupplier(item.id, e.target.value || null)}
                          >
                            <option value="">ללא ספק</option>
                            {suppliers.map(s => (
                              <option key={s.id} value={String(s.id)}>{s.name}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="table-supplier-tag">
                            {suppliers.find(s => String(s.id) === String(item.supplierId))?.name || 'ללא ספק'}
                          </span>
                        )}
                      </td>
                      <td>{item.quantity} {item.unit}</td>
                      <td>{item.minQuantity} {item.unit}</td>
                      <td>
                        <span className={`badge ${isLowStock ? "danger" : "success"}`}>
                          {isLowStock ? "חסר!" : "תקין"}
                        </span>
                      </td>
                      <td>
                        {expiry ? (
                          <span className={`expiry-badge ${isExpired ? 'expiry-expired' : isSoonExpiry ? 'expiry-soon' : 'expiry-ok'}`}>
                            {isExpired
                              ? `פג לפני ${Math.abs(daysLeft)} יום`
                              : isSoonExpiry
                              ? `עוד ${daysLeft} יום`
                              : expiry.toLocaleDateString('he-IL')}
                          </span>
                        ) : <span className="expiry-none">—</span>}
                      </td>
                      {isAdmin ? (
                        <>
                          <td>
                            <div className="quick-update-btns">
                              <button className="qty-btn plus" onClick={() => updateQuantity(item.id, 1)}>+1</button>
                              <button className="qty-btn minus" onClick={() => updateQuantity(item.id, -1)}>-1</button>
                            </div>
                          </td>
                          <td>
                            <div className="bulk-update-container">
                              <input
                                type="number"
                                placeholder="כמות..."
                                className="table-input"
                                value={bulkInputs[item.id] || ''}
                                onChange={(e) => handleBulkInputChange(item.id, e.target.value)}
                                step="0.01"
                              />
                              <button className="bulk-btn bulk-plus" onClick={() => handleBulkUpdate(item.id)}>עדכון</button>
                            </div>
                          </td>
                          <td>
                            <button className="delete-btn" onClick={() => deleteItem(item.id, item.name)}>🗑️</button>
                          </td>
                        </>
                      ) : (
                        <td colSpan="4" className="td-view-only">צפייה בלבד</td>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan="10" className="td-empty">לא נמצאו חומרי גלם מתאימים</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {showAddModal && (
        <div className="add-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="add-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="add-modal-header">
              <h2>הוספת חומר גלם חדש</h2>
              <button className="add-modal-close" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
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
                  <select name="unit" value={formData.unit} onChange={handleChange} disabled={isLoading}>
                    <option value="ק''ג">ק"ג</option>
                    <option value="ליטר">ליטר</option>
                    <option value="יחידות">יחידות</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>קטגוריית מוצר</label>
                  <select name="category" value={formData.category} onChange={handleChange} disabled={isLoading}>
                    {CATEGORIES.filter(cat => cat.id !== 'all').map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>ספק משויך</label>
                  <select name="supplierId" value={formData.supplierId} onChange={handleChange} disabled={isLoading}>
                    <option value="">ללא ספק</option>
                    {suppliers.map(sup => (
                      <option key={sup.id} value={sup.id}>{sup.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-row">
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
                <div className="form-group">
                  <label>תאריך תפוגה</label>
                  <input
                    type="date"
                    name="expiryDate"
                    value={formData.expiryDate}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                </div>
              </div>
              <button type="submit" className="submit-btn" disabled={isLoading}>
                {isLoading ? 'מוסיף...' : 'הוסף למזווה'}
              </button>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirm.open}
        title={confirm.title}
        message={confirm.message}
        onConfirm={confirm.onConfirm}
        onCancel={() => setConfirm(c => ({ ...c, open: false }))}
      />
    </div>
  );
}

export default Inventory;
