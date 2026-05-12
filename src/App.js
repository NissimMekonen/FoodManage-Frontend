import React, { useState, useEffect } from 'react';
import './App.css';

// ייבוא הרכיבים החדשים שלנו
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import Suppliers from './components/Suppliers';

function App() {
  const [currentScreen, setCurrentScreen] = useState('dashboard');

  // טעינה וניהול סטייט ספקים
  const [suppliers, setSuppliers] = useState(() => {
    const savedSuppliers = localStorage.getItem('kitchen_suppliers');
    if (savedSuppliers) return JSON.parse(savedSuppliers);
    return [
      { id: 'sup1', name: 'טרה ספקים', contact: 'יוסי', phone: '050-1234567' },
      { id: 'sup2', name: 'ירקות השדה', contact: 'אבי', phone: '052-7654321' },
      { id: 'sup3', name: 'ספק יבשים ומזווה', contact: 'רוני', phone: '054-9988776' }
    ];
  });

  // טעינה וניהול סטייט מלאי
  const [inventory, setInventory] = useState(() => {
    const savedInventory = localStorage.getItem('kitchen_inventory');
    if (savedInventory) return JSON.parse(savedInventory);
    return [
      { id: 1, name: 'קמח לבן', quantity: 15, unit: "ק''ג", minQuantity: 5, category: 'dry', supplierId: 'sup3' },
      { id: 2, name: 'חמאה', quantity: 2, unit: "ק''ג", minQuantity: 3, category: 'dairy', supplierId: 'sup1' },
      { id: 3, name: 'סוכר לבן', quantity: 8, unit: "ק''ג", minQuantity: 4, category: 'dry', supplierId: 'sup3' },
      { id: 4, name: 'שוקולד מריר 60%', quantity: 1.5, unit: "ק''ג", minQuantity: 2, category: 'dry', supplierId: 'sup3' }
    ];
  });

  // שמירה אוטומטית בזיכרון
  useEffect(() => {
    localStorage.setItem('kitchen_inventory', JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem('kitchen_suppliers', JSON.stringify(suppliers));
  }, [suppliers]);

  // פונקציה גלובלית לעדכון כמויות (בשימוש גם במלאי וגם בדאשבורד אם נרצה)
  const updateQuantity = (id, amount) => {
    setInventory(inventory.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, item.quantity + amount);
        return { ...item, quantity: Number(newQty.toFixed(2)) };
      }
      return item;
    }));
  };

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

      {/* ניתוב חכם בין המסכים */}
      {currentScreen === 'dashboard' && (
        <Dashboard setCurrentScreen={setCurrentScreen} lowStockCount={lowStockCount} />
      )}

      {currentScreen === 'inventory' && (
        <Inventory inventory={inventory} setInventory={setInventory} suppliers={suppliers} updateQuantity={updateQuantity} />
      )}

      {currentScreen === 'suppliers' && (
        <Suppliers suppliers={suppliers} setSuppliers={setSuppliers} inventory={inventory} />
      )}

      {currentScreen === 'menus' && (
        <div className="placeholder-screen animate-fade-in">
          <div className="placeholder-card">
            <h2>🍳 תפריטים ועצי מוצר</h2>
            <p>כאן נבנה בעתיד את המתכונים של המנות (רספיז).</p>
            <p className="status-note">המודול נמצא בשלבי תכנון.</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;