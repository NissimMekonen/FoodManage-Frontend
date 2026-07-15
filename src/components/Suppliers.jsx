import React, { useState, useEffect, useMemo } from 'react';
import './styles/suppliers.css';
import ConfirmModal from './ConfirmModal';

const suggestedQty = (item) =>
  Math.max(1, Math.ceil(Math.max(item.minQuantity - item.quantity, item.minQuantity || 1)));

const buildOrderText = (supplier, lines) => {
  const items = Object.values(lines || {}).filter(l => Number(l.qty) > 0);
  if (!supplier || items.length === 0) return '';
  let text = `שלום ${supplier.contact} (${supplier.name}),\nאשמח להוציא הזמנה חדשה עבור המטבח:\n\n`;
  items.forEach(line => {
    text += `• ${line.name} - להזמין: ${Number(line.qty)} ${line.unit} (קיים במלאי: ${line.stock} ${line.unit})\n`;
  });
  text += `\nתודה רבה!`;
  return text;
};

const buildLowStockLines = (inventory, supplierId) => {
  const initial = {};
  inventory
    .filter(item => String(item.supplierId) === String(supplierId) && item.quantity <= item.minQuantity)
    .forEach(item => {
      initial[item.id] = {
        name: item.name,
        unit: item.unit,
        stock: item.quantity,
        qty: suggestedQty(item),
        isLow: true
      };
    });
  return initial;
};

function Suppliers({ suppliers, setSuppliers, inventory, showToast, isAdmin }) {
  const [supplierFormData, setSupplierFormData] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: ''
  });
  const [activeOrderSupplier, setActiveOrderSupplier] = useState('');
  // טיוטות הזמנה לפי ספק — נשמרות במעבר בין ספקים
  const [orderDrafts, setOrderDrafts] = useState({}); // { [supplierId]: { lines, showOrderText } }
  const [isLoading, setIsLoading] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [orderText, setOrderText] = useState('');
  const [confirm, setConfirm] = useState({ open: false, title: '', message: '', onConfirm: null });

  const currentDraft = activeOrderSupplier ? orderDrafts[activeOrderSupplier] : null;
  const orderLines = currentDraft?.lines || {};
  const showOrderText = currentDraft?.showOrderText || false;

  const setCurrentLines = (updater) => {
    if (!activeOrderSupplier) return;
    setOrderDrafts(prev => {
      const current = prev[activeOrderSupplier] || { lines: {}, showOrderText: false };
      const nextLines = typeof updater === 'function' ? updater(current.lines) : updater;
      return {
        ...prev,
        [activeOrderSupplier]: { ...current, lines: nextLines }
      };
    });
  };

  const setShowOrderText = (value) => {
    if (!activeOrderSupplier) return;
    setOrderDrafts(prev => {
      const current = prev[activeOrderSupplier] || { lines: {}, showOrderText: false };
      const next = typeof value === 'function' ? value(current.showOrderText) : value;
      return {
        ...prev,
        [activeOrderSupplier]: { ...current, showOrderText: next }
      };
    });
  };

  const handleSupplierChange = (e) => {
    setSupplierFormData({ ...supplierFormData, [e.target.name]: e.target.value });
  };

  const handleSupplierSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch('http://localhost:5148/api/Suppliers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: supplierFormData.name,
          contactPerson: supplierFormData.contactPerson,
          phone: supplierFormData.phone,
          email: supplierFormData.email,
          address: supplierFormData.address
        })
      });

      if (!response.ok) throw new Error('Failed to create supplier');

      const newSupplier = await response.json();
      setSuppliers([...suppliers, {
        id: newSupplier.id,
        name: newSupplier.name,
        contact: newSupplier.contactPerson,
        phone: newSupplier.phone,
        email: newSupplier.email,
        address: newSupplier.address
      }]);
      setSupplierFormData({ name: '', contactPerson: '', phone: '', email: '', address: '' });
      showToast('הספק נוסף בהצלחה!', 'success');
    } catch (err) {
      console.error('Error creating supplier:', err);
      showToast('שגיאה בהוספת ספק: ' + err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSupplier = (id, name) => {
    setConfirm({
      open: true,
      title: 'מחיקת ספק',
      message: `האם למחוק את "${name}"? מוצרים המשויכים אליו יישארו ללא ספק.`,
      onConfirm: async () => {
        setConfirm(c => ({ ...c, open: false }));
        try {
          const token = sessionStorage.getItem('token');
          const response = await fetch(`http://localhost:5148/api/Suppliers/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (!response.ok) throw new Error('Failed to delete supplier');
          setSuppliers(suppliers.filter(s => s.id !== id));
          setOrderDrafts(prev => {
            const next = { ...prev };
            delete next[id];
            return next;
          });
          if (String(activeOrderSupplier) === String(id)) setActiveOrderSupplier('');
          showToast('הספק נמחק בהצלחה!', 'success');
        } catch (err) {
          console.error('Error deleting supplier:', err);
          showToast('שגיאה במחיקת ספק: ' + err.message, 'error');
        }
      }
    });
  };

  // מוצרים המשויכים לספק הנבחר בלבד
  const supplierProducts = useMemo(() => {
    if (!activeOrderSupplier) return [];
    return inventory.filter(i => String(i.supplierId) === String(activeOrderSupplier));
  }, [activeOrderSupplier, inventory]);

  // חיפוש רק במוצרים של הספק הנבחר
  const searchResults = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    const pool = !q
      ? supplierProducts
      : supplierProducts.filter(i => i.name.toLowerCase().includes(q));
    return pool.slice(0, 50);
  }, [productSearch, supplierProducts]);

  // מעבר בין ספקים — שומר טיוטה קיימת / טוען טיוטה / יוצר חדשה מחוסרים
  const selectOrderSupplier = (supplierId) => {
    setProductSearch('');
    setOrderText('');

    if (!supplierId) {
      setActiveOrderSupplier('');
      return;
    }

    setOrderDrafts(prev => {
      if (prev[supplierId]) return prev;
      return {
        ...prev,
        [supplierId]: {
          lines: buildLowStockLines(inventory, supplierId),
          showOrderText: false
        }
      };
    });

    setActiveOrderSupplier(supplierId);

    const existing = orderDrafts[supplierId];
    if (existing && Object.keys(existing.lines || {}).length > 0) {
      showToast('נטענה טיוטת הזמנה שמורה לספק זה', 'success');
    }
  };

  // בניית טקסט הזמנה לטיוטה הפעילה
  useEffect(() => {
    if (!activeOrderSupplier) {
      setOrderText('');
      return;
    }
    const supplierObj = suppliers.find(s => String(s.id) === String(activeOrderSupplier));
    setOrderText(buildOrderText(supplierObj, orderLines));
  }, [orderLines, activeOrderSupplier, suppliers]);

  const addToOrder = (item) => {
    if (String(item.supplierId) !== String(activeOrderSupplier)) {
      showToast('ניתן להוסיף להזמנה רק מוצרים המשויכים לספק זה', 'error');
      return;
    }
    setCurrentLines(prev => {
      if (prev[item.id]) return prev;
      return {
        ...prev,
        [item.id]: {
          name: item.name,
          unit: item.unit,
          stock: item.quantity,
          qty: suggestedQty(item),
          isLow: item.quantity <= item.minQuantity
        }
      };
    });
    showToast(`"${item.name}" נוסף להזמנה`, 'success');
  };

  const updateOrderQty = (id, qty) => {
    const n = parseFloat(qty);
    setCurrentLines(prev => ({
      ...prev,
      [id]: { ...prev[id], qty: isNaN(n) ? '' : n }
    }));
  };

  const removeFromOrder = (id) => {
    setCurrentLines(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const addAllLowStock = () => {
    const low = supplierProducts.filter(i => i.quantity <= i.minQuantity && !orderLines[i.id]);
    if (low.length === 0) {
      showToast('אין מוצרים בחוסר להוספה', 'success');
      return;
    }
    setCurrentLines(prev => {
      const next = { ...prev };
      low.forEach(item => {
        next[item.id] = {
          name: item.name,
          unit: item.unit,
          stock: item.quantity,
          qty: suggestedQty(item),
          isLow: true
        };
      });
      return next;
    });
    showToast(`${low.length} מוצרים בחוסר נוספו להזמנה`, 'success');
  };

  const clearCurrentOrder = () => {
    if (!activeOrderSupplier) return;
    setConfirm({
      open: true,
      title: 'ניקוי הזמנה',
      message: 'האם לנקות את טיוטת ההזמנה של הספק הנוכחי?',
      onConfirm: () => {
        setConfirm(c => ({ ...c, open: false }));
        setOrderDrafts(prev => {
          const next = { ...prev };
          delete next[activeOrderSupplier];
          return next;
        });
        setOrderText('');
        showToast('ההזמנה נוקתה', 'success');
      }
    });
  };

  const pendingDrafts = useMemo(() => {
    return Object.entries(orderDrafts)
      .map(([sid, draft]) => {
        const count = Object.keys(draft.lines || {}).length;
        if (count === 0) return null;
        const sup = suppliers.find(s => String(s.id) === String(sid));
        return { id: sid, name: sup?.name || 'ספק', count };
      })
      .filter(Boolean);
  }, [orderDrafts, suppliers]);

  const orderEntries = Object.entries(orderLines);
  const orderCount = orderEntries.length;
  const activeSupplierName = suppliers.find(s => String(s.id) === String(activeOrderSupplier))?.name;

  const copyOrderToClipboard = () => {
    navigator.clipboard.writeText(orderText);
    showToast('ההזמנה הועתקה ללוח!', 'success');
  };

  const sendWhatsApp = () => {
    const supplierObj = suppliers.find(s => String(s.id) === String(activeOrderSupplier));
    if (!supplierObj?.phone) return;
    if (!orderText) {
      showToast('הוסף מוצרים להזמנה לפני השליחה', 'error');
      return;
    }
    const phone = supplierObj.phone.replace(/[\s\-()]/g, '');
    const intlPhone = phone.startsWith('0') ? '972' + phone.slice(1) : phone.replace('+', '');
    window.open(`https://wa.me/${intlPhone}?text=${encodeURIComponent(orderText)}`, '_blank');
    showToast('ההזמנה נפתחה בוואטסאפ — הטיוטה נשמרה עד שתנקה אותה', 'success');
  };

  return (
    <div className="main-layout animate-fade-in">
      <section className="form-section supplier-border">
        <h2>{isAdmin ? 'הוספת ספק חדש' : 'רשימת ספקים'}</h2>

        {isAdmin && (
          <form onSubmit={handleSupplierSubmit}>
            <div className="form-group">
              <label>שם החברה / הספק *</label>
              <input type="text" name="name" value={supplierFormData.name} onChange={handleSupplierChange} placeholder="למשל: מחלבות גד" required disabled={isLoading} />
            </div>
            <div className="form-group">
              <label>שם איש קשר *</label>
              <input type="text" name="contactPerson" value={supplierFormData.contactPerson} onChange={handleSupplierChange} placeholder="למשל: משה" required disabled={isLoading} />
            </div>
            <div className="form-group">
              <label>מספר טלפון להזמנות *</label>
              <input type="text" name="phone" value={supplierFormData.phone} onChange={handleSupplierChange} placeholder="למשל: 0501234567" required disabled={isLoading} />
            </div>
            <div className="form-group">
              <label>אימייל (אופציונלי)</label>
              <input type="email" name="email" value={supplierFormData.email} onChange={handleSupplierChange} placeholder="למשל: orders@supplier.com" disabled={isLoading} />
            </div>
            <div className="form-group">
              <label>כתובת (אופציונלי)</label>
              <input type="text" name="address" value={supplierFormData.address} onChange={handleSupplierChange} placeholder="למשל: תל אביב, רחוב הירקון 1" disabled={isLoading} />
            </div>
            <button type="submit" className="submit-btn supplier-btn" disabled={isLoading}>
              {isLoading ? 'שומר...' : 'שמור ספק במערכת'}
            </button>
          </form>
        )}

        <div className="suppliers-list-box">
          <h3>רשימת ספקים רשומים ({suppliers.length})</h3>
          {suppliers.map(sup => (
            <div key={sup.id} className="mini-supplier-card">
              <div>
                <strong>{sup.name}</strong>
                <div className="supplier-card-subtext">
                  {sup.contact} | {sup.phone}
                  {sup.email && <> | {sup.email}</>}
                </div>
              </div>
              {isAdmin && (
                <button className="delete-btn mini-del-btn" onClick={() => deleteSupplier(sup.id, sup.name)}>🗑️</button>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="table-section supplier-table-border">
        <div className="table-header-container">
          <h2>📋 יצירת הזמנת רכש</h2>
        </div>

        {pendingDrafts.length > 0 && (
          <div className="order-drafts-bar">
            <span className="order-drafts-label">טיוטות ממתינות:</span>
            <div className="order-drafts-chips">
              {pendingDrafts.map(d => (
                <button
                  key={d.id}
                  type="button"
                  className={`order-draft-chip ${String(activeOrderSupplier) === String(d.id) ? 'active' : ''}`}
                  onClick={() => selectOrderSupplier(d.id)}
                >
                  {d.name}
                  <span className="order-draft-count">{d.count}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="order-generator-box">
          <label>בחר ספק להזמנה (אפשר לעבור בין ספקים — הטיוטות נשמרות)</label>
          <select
            value={activeOrderSupplier}
            onChange={(e) => selectOrderSupplier(e.target.value)}
          >
            <option value="">-- בחר ספק --</option>
            {suppliers.map(sup => {
              const lowCount = inventory.filter(
                i => String(i.supplierId) === String(sup.id) && i.quantity <= i.minQuantity
              ).length;
              const draftCount = Object.keys(orderDrafts[sup.id]?.lines || {}).length;
              let suffix = '';
              if (draftCount > 0) suffix = ` — טיוטה: ${draftCount}`;
              else if (lowCount > 0) suffix = ` (${lowCount} בחוסר)`;
              return (
                <option key={sup.id} value={sup.id}>
                  {sup.name}{suffix}
                </option>
              );
            })}
          </select>
        </div>

        {activeOrderSupplier ? (
          <div className="order-results">
            <div className="order-active-banner">
              הזמנה מול: <strong>{activeSupplierName}</strong>
              <span className="order-active-hint">רק מוצרים המשויכים לספק זה</span>
            </div>

            <div className="order-add-section">
              <div className="order-add-header">
                <h3>הוסף מוצרים של הספק</h3>
                <button type="button" className="order-quick-low-btn" onClick={addAllLowStock}>
                  + הוסף את כל החוסרים
                </button>
              </div>
              <div className="order-search-row">
                <span className="order-search-icon">🔍</span>
                <input
                  type="text"
                  className="order-search-input"
                  placeholder={`חפש מוצר של ${activeSupplierName || 'הספק'}...`}
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                />
                {productSearch && (
                  <button type="button" className="order-search-clear" onClick={() => setProductSearch('')}>✕</button>
                )}
              </div>
              <p className="order-search-hint">
                מוצגים רק מוצרים המשויכים ל-{activeSupplierName}. מוצרים של ספקים אחרים לא יופיעו.
              </p>
              <div className="order-product-list">
                {searchResults.length === 0 ? (
                  <div className="order-product-empty">
                    {supplierProducts.length === 0
                      ? 'אין מוצרים משויכים לספק זה במלאי'
                      : 'לא נמצאו מוצרים התואמים לחיפוש'}
                  </div>
                ) : (
                  searchResults.map(item => {
                    const inOrder = !!orderLines[item.id];
                    const isLow = item.quantity <= item.minQuantity;
                    return (
                      <div key={item.id} className={`order-product-row ${isLow ? 'is-low' : ''}`}>
                        <div className="order-product-info">
                          <strong>{item.name}</strong>
                          <span className="order-product-meta">
                            במלאי: {item.quantity} {item.unit}
                            {isLow && <span className="order-low-tag">חוסר</span>}
                          </span>
                        </div>
                        <button
                          type="button"
                          className={`order-add-btn ${inOrder ? 'added' : ''}`}
                          disabled={inOrder}
                          onClick={() => addToOrder(item)}
                        >
                          {inOrder ? '✓ בהזמנה' : '+ הוסף'}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="order-cart-section">
              <div className="order-cart-header">
                <h3>ההזמנה ל-{activeSupplierName} ({orderCount} פריטים)</h3>
                {orderCount > 0 && (
                  <button type="button" className="order-clear-btn" onClick={clearCurrentOrder}>
                    נקה הזמנה
                  </button>
                )}
              </div>
              {orderCount === 0 ? (
                <div className="no-missing-alert order-empty-cart">
                  אין פריטים בהזמנה. הוסף מוצרים של הספק מלמעלה, או עבור לספק אחר — הטיוטות נשמרות.
                </div>
              ) : (
                <>
                  <div className="table-wrapper table-wrapper--mb">
                    <table>
                      <thead>
                        <tr>
                          <th>מוצר</th>
                          <th>במלאי</th>
                          <th>כמות להזמנה</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {orderEntries.map(([id, line]) => (
                          <tr key={id} className={line.isLow ? 'order-line-low' : ''}>
                            <td>
                              <strong className={line.isLow ? 'low-product-name' : ''}>{line.name}</strong>
                              {line.isLow && <span className="order-low-tag">חוסר</span>}
                            </td>
                            <td>{line.stock} {line.unit}</td>
                            <td>
                              <div className="order-qty-edit">
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  className="order-qty-input"
                                  value={line.qty}
                                  onChange={(e) => updateOrderQty(id, e.target.value)}
                                />
                                <span className="order-qty-unit">{line.unit}</span>
                              </div>
                            </td>
                            <td>
                              <button
                                type="button"
                                className="order-remove-btn"
                                title="הסר מההזמנה"
                                onClick={() => removeFromOrder(id)}
                              >
                                ✕
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="order-actions-row">
                    <button className="order-action-btn order-action-btn--copy" onClick={() => setShowOrderText(v => !v)}>
                      <i className="bi bi-envelope-paper"></i>
                      {showOrderText ? 'הסתר הודעה' : 'הכן הודעה לספק'}
                    </button>
                    <button className="order-action-btn order-action-btn--whatsapp" onClick={sendWhatsApp}>
                      <i className="bi bi-whatsapp"></i>
                      שלח בוואטסאפ
                    </button>
                  </div>
                  {showOrderText && orderText && (
                    <div className="order-text-box">
                      <button className="order-copy-btn" onClick={copyOrderToClipboard} title="העתק">
                        <i className="bi bi-copy"></i>
                      </button>
                      <textarea
                        className="order-textarea"
                        value={orderText}
                        onChange={(e) => setOrderText(e.target.value)}
                        rows={7}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="choose-supplier-prompt">
            בחר ספק כדי להתחיל הזמנה. אפשר לעבוד מול כמה ספקים במקביל — כל טיוטה נשמרת בנפרד עד לשליחה או ניקוי.
          </div>
        )}
      </section>

      <ConfirmModal
        isOpen={confirm.open}
        title={confirm.title}
        message={confirm.message}
        onConfirm={confirm.onConfirm}
        onCancel={() => setConfirm(c => ({ ...c, open: false }))}
        confirmText={confirm.title === 'ניקוי הזמנה' ? 'נקה' : 'מחק'}
      />
    </div>
  );
}

export default Suppliers;
