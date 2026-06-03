import React, { useState, useEffect } from 'react';
import './styles/suppliers.css';
import ConfirmModal from './ConfirmModal';

function Suppliers({ suppliers, setSuppliers, inventory, showToast, isAdmin }) {
  const [supplierFormData, setSupplierFormData] = useState({ 
    name: '', 
    contactPerson: '', 
    phone: '',
    email: '',
    address: ''
  });
  const [activeOrderSupplier, setActiveOrderSupplier] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [orderText, setOrderText] = useState('');
  const [confirm, setConfirm] = useState({ open: false, title: '', message: '', onConfirm: null });

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

      if (!response.ok) {
        throw new Error('Failed to create supplier');
      }

      const newSupplier = await response.json();
      
      const formattedSupplier = {
        id: newSupplier.id,
        name: newSupplier.name,
        contact: newSupplier.contactPerson,
        phone: newSupplier.phone,
        email: newSupplier.email,
        address: newSupplier.address
      };

      setSuppliers([...suppliers, formattedSupplier]);
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
          showToast('הספק נמחק בהצלחה!', 'success');
        } catch (err) {
          console.error('Error deleting supplier:', err);
          showToast('שגיאה במחיקת ספק: ' + err.message, 'error');
        }
      }
    });
  };

  const missingItemsForActiveSupplier = inventory.filter(item =>
    String(item.supplierId) === String(activeOrderSupplier) && item.quantity <= item.minQuantity
  );

  useEffect(() => {
    if (!activeOrderSupplier) { setOrderText(''); return; }
    const supplierObj = suppliers.find(s => s.id === activeOrderSupplier);
    const missing = inventory.filter(item =>
      String(item.supplierId) === String(activeOrderSupplier) && item.quantity <= item.minQuantity
    );
    if (!supplierObj || missing.length === 0) { setOrderText(''); return; }

    let text = `שלום ${supplierObj.contact} (${supplierObj.name}),\nאשמח להוציא הזמנה חדשה עבור המטבח:\n\n`;
    missing.forEach(item => {
      const orderQty = Math.max(1, item.minQuantity - item.quantity);
      text += `• ${item.name} - להזמין בסביבות: ${orderQty.toFixed(0)} ${item.unit} (קיים במלאי: ${item.quantity} ${item.unit})\n`;
    });
    text += `\nתודה רבה!`;
    setOrderText(text);
  }, [activeOrderSupplier, suppliers, inventory]);

  const copyOrderToClipboard = () => {
    navigator.clipboard.writeText(orderText);
    showToast('ההזמנה הועתקה ללוח!', 'success');
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
          <h2>📋 יצירת הזמנת רכש חכמה</h2>
        </div>
        
        <div className="order-generator-box">
          <label>שלב א': בחר ספק שאליו תרצה להוציא הזמנה</label>
          <select value={activeOrderSupplier} onChange={(e) => setActiveOrderSupplier(e.target.value)}>
            <option value="">-- בחר ספק כדי לבדוק חוסרים --</option>
            {suppliers.map(sup => {
              const countCount = inventory.filter(i => String(i.supplierId) === String(sup.id) && i.quantity <= i.minQuantity).length;
              return (
                <option key={sup.id} value={sup.id}>{sup.name} ({countCount} מוצרים בחוסר)</option>
              );
            })}
          </select>
        </div>

        {activeOrderSupplier ? (
          <div className="order-results">
            <h3>שלב ב': מוצרים בחוסר המשויכים לספק זה</h3>
            
            {missingItemsForActiveSupplier.length > 0 ? (
              <div>
                <div className="table-wrapper table-wrapper--mb">
                  <table>
                    <thead>
                      <tr>
                        <th>שם מוצר חסר</th>
                        <th>מלאי נוכחי</th>
                        <th>מלאי מינימום</th>
                        <th>כמות מומלצת להזמנה</th>
                      </tr>
                    </thead>
                    <tbody>
                      {missingItemsForActiveSupplier.map(item => (
                        <tr key={item.id}>
                          <td><strong className="low-product-name">{item.name}</strong></td>
                          <td>{item.quantity} {item.unit}</td>
                          <td>{item.minQuantity} {item.unit}</td>
                          <td>
                            <span className="badge danger badge-sq">
                              {(item.minQuantity - item.quantity).toFixed(0)} {item.unit}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {orderText && (
                  <div className="order-text-box">
                    <button className="order-copy-btn" onClick={copyOrderToClipboard} title="העתק">
                      <i className="bi bi-copy"></i>
                    </button>
                    <textarea
                      className="order-textarea"
                      value={orderText}
                      onChange={(e) => setOrderText(e.target.value)}
                      rows={8}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="no-missing-alert">
                🎉 מעולה! אין חומרי גלם חסרים המשויכים לספק זה. הכל תקין במלאי!
              </div>
            )}
          </div>
        ) : (
          <div className="choose-supplier-prompt">
            בחר ספק בתיבה למעלה והמערכת תרכז עבורך אוטומטית את כל המוצרים שצריך להזמין ממנו!
          </div>
        )}
      </section>

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

export default Suppliers;
