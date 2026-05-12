import React, { useState } from 'react';
import './Suppliers.css';

function Suppliers({ suppliers, setSuppliers, inventory }) {
  const [supplierFormData, setSupplierFormData] = useState({ name: '', contact: '', phone: '' });
  const [activeOrderSupplier, setActiveOrderSupplier] = useState('');

  const handleSupplierChange = (e) => {
    setSupplierFormData({ ...supplierFormData, [e.target.name]: e.target.value });
  };

  const handleSupplierSubmit = (e) => {
    e.preventDefault();
    const newSupplier = {
      id: 'sup_' + Date.now(),
      name: supplierFormData.name,
      contact: supplierFormData.contact,
      phone: supplierFormData.phone
    };
    setSuppliers([...suppliers, newSupplier]);
    setSupplierFormData({ name: '', contact: '', phone: '' });
  };

  const deleteSupplier = (id, name) => {
    if (window.confirm(`האם למחוק את הספק "${name}"? מוצרים המשוייכים אליו יישארו ללא ספק.`)) {
      setSuppliers(suppliers.filter(s => s.id !== id));
    }
  };

  // סינון חומרי גלם שחסרים ושייכים לספק שנבחר
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
      {/* ימין: הוספת ספק חדש */}
      <section className="form-section supplier-border">
        <h2>הוספת ספק חדש</h2>
        <form onSubmit={handleSupplierSubmit}>
          <div className="form-group">
            <label>שם החברה / הספק *</label>
            <input type="text" name="name" value={supplierFormData.name} onChange={handleSupplierChange} placeholder="למשל: מחלבות גד" required />
          </div>
          <div className="form-group">
            <label>שם איש קשר *</label>
            <input type="text" name="contact" value={supplierFormData.contact} onChange={handleSupplierChange} placeholder="למשל: משה" required />
          </div>
          <div className="form-group">
            <label>מספר טלפון להזמנות *</label>
            <input type="text" name="phone" value={supplierFormData.phone} onChange={handleSupplierChange} placeholder="למשל: 0501234567" required />
          </div>
          <button type="submit" className="submit-btn supplier-btn">שמור ספק במערכת</button>
        </form>

        <div className="suppliers-list-box">
          <h3>רשימת ספקים רשומים ({suppliers.length})</h3>
          {suppliers.map(sup => (
            <div key={sup.id} className="mini-supplier-card">
              <div>
                <strong>{sup.name}</strong>
                <div className="supplier-card-subtext">{sup.contact} | {sup.phone}</div>
              </div>
              <button className="delete-btn mini-del-btn" onClick={() => deleteSupplier(sup.id, sup.name)}>🗑️</button>
            </div>
          ))}
        </div>
      </section>

      {/* שמאל: מחולל הזמנות */}
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