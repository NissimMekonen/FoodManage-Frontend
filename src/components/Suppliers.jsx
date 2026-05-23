import React, { useState, useEffect } from 'react';
import './Suppliers.css';

function Suppliers({ suppliers, setSuppliers, inventory }) {
  const [supplierFormData, setSupplierFormData] = useState({ 
    name: '', 
    contactPerson: '', 
    phone: '',
    email: '',
    address: ''
  });
  const [activeOrderSupplier, setActiveOrderSupplier] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // ✅ טען ספקים מה-API
  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5148/api/Suppliers', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const formattedSuppliers = data.map(s => ({
          id: s.id,
          name: s.name,
          contact: s.contactPerson,
          phone: s.phone,
          email: s.email,
          address: s.address
        }));
        setSuppliers(formattedSuppliers);
      }
    } catch (err) {
      console.error('Error loading suppliers:', err);
      // ✅ לא משתמש ב-localStorage יותר!
      setSuppliers([]);
    }
  };

  const handleSupplierChange = (e) => {
    setSupplierFormData({ ...supplierFormData, [e.target.name]: e.target.value });
  };

  const handleSupplierSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
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
      alert('✅ הספק נוסף בהצלחה!');
    } catch (err) {
      console.error('Error creating supplier:', err);
      alert('❌ שגיאה בהוספת ספק: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSupplier = async (id, name) => {
    if (!window.confirm(`האם למחוק את הספק "${name}"? מוצרים המשוייכים אליו יישארו ללא ספק.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5148/api/Suppliers/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete supplier');
      }

      setSuppliers(suppliers.filter(s => s.id !== id));
      alert('✅ הספק נמחק בהצלחה!');
    } catch (err) {
      console.error('Error deleting supplier:', err);
      alert('❌ שגיאה במחיקת ספק: ' + err.message);
    }
  };

  const missingItemsForActiveSupplier = inventory.filter(item => 
    item.supplierId === activeOrderSupplier && item.quantity <= item.minQuantity
  );

  const copyOrderToClipboard = () => {
    const supplierObj = suppliers.find(s => s.id === activeOrderSupplier);
    if (!supplierObj || missingItemsForActiveSupplier.length === 0) return;

    let text = `שלום ${supplierObj.contact} (${supplierObj.name}),\nאשמח להוציא הזמנה חדשה עבור המטבח:\n\n`;
    missingItemsForActiveSupplier.forEach(item => {
      const orderQty = Math.max(1, item.minQuantity - item.quantity);
      text += `• ${item.name} - להזמין בסביבות: ${orderQty.toFixed(0)} ${item.unit} (קיים במלאי: ${item.quantity} ${item.unit})\n`;
    });
    text += `\nתודה רבה!`;

    navigator.clipboard.writeText(text);
    alert('ההזמנה הועתקה ללוח! עכשיו אתה יכול להדביק אותה ישירות בוואטסאפ של הספק.');
  };

  return (
    <div className="main-layout animate-fade-in">
      <section className="form-section supplier-border">
        <h2>הוספת ספק חדש</h2>
        <form onSubmit={handleSupplierSubmit}>
          <div className="form-group">
            <label>שם החברה / הספק *</label>
            <input 
              type="text" 
              name="name" 
              value={supplierFormData.name} 
              onChange={handleSupplierChange} 
              placeholder="למשל: מחלבות גד" 
              required 
              disabled={isLoading}
            />
          </div>
          <div className="form-group">
            <label>שם איש קשר *</label>
            <input 
              type="text" 
              name="contactPerson" 
              value={supplierFormData.contactPerson} 
              onChange={handleSupplierChange} 
              placeholder="למשל: משה" 
              required 
              disabled={isLoading}
            />
          </div>
          <div className="form-group">
            <label>מספר טלפון להזמנות *</label>
            <input 
              type="text" 
              name="phone" 
              value={supplierFormData.phone} 
              onChange={handleSupplierChange} 
              placeholder="למשל: 0501234567" 
              required 
              disabled={isLoading}
            />
          </div>
          <div className="form-group">
            <label>אימייל (אופציונלי)</label>
            <input 
              type="email" 
              name="email" 
              value={supplierFormData.email} 
              onChange={handleSupplierChange} 
              placeholder="למשל: orders@supplier.com"
              disabled={isLoading}
            />
          </div>
          <div className="form-group">
            <label>כתובת (אופציונלי)</label>
            <input 
              type="text" 
              name="address" 
              value={supplierFormData.address} 
              onChange={handleSupplierChange} 
              placeholder="למשל: תל אביב, רחוב הירקון 1"
              disabled={isLoading}
            />
          </div>
          <button type="submit" className="submit-btn supplier-btn" disabled={isLoading}>
            {isLoading ? 'שומר...' : 'שמור ספק במערכת'}
          </button>
        </form>

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
              <button className="delete-btn mini-del-btn" onClick={() => deleteSupplier(sup.id, sup.name)}>🗑️</button>
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
              const countCount = inventory.filter(i => i.supplierId === sup.id && i.quantity <= i.minQuantity).length;
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
                <div className="table-wrapper" style={{marginBottom: '20px'}}>
                  <table style={{background: '#fff'}}>
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
                          <td><strong style={{color: '#e74c3c'}}>{item.name}</strong></td>
                          <td>{item.quantity} {item.unit}</td>
                          <td>{item.minQuantity} {item.unit}</td>
                          <td>
                            <span className="badge danger" style={{borderRadius: '4px'}}>
                              {(item.minQuantity - item.quantity).toFixed(0)} {item.unit}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <button className="submit-btn" onClick={copyOrderToClipboard} style={{backgroundColor: '#16a085'}}>
                  📋 העתק נוסח הזמנה מוכן לוואטסאפ
                </button>
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
    </div>
  );
}

export default Suppliers;