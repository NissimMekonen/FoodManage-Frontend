import React, { useState, useEffect } from 'react';
import './App.css';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import Suppliers from './components/Suppliers';
import Login from './components/Login';
import { getProducts, createProduct, updateProduct, deleteProduct } from './api';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentScreen, setCurrentScreen] = useState('dashboard');
  const [inventory, setInventory] = useState([]);
  const [suppliers, setSuppliers] = useState([
    { id: 'sup1', name: 'ספק הירקות של משה', contact: 'משה כהן', phone: '050-1234567' },
    { id: 'sup2', name: 'ספק החלב והגבינות', contact: 'דוד לוי', phone: '052-7654321' },
    { id: 'sup3', name: 'ספק יבשים ודגנים', contact: 'רונן', phone: '054-9988776' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // ✅ בדוק אם יש Token בהתחלה
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  // ✅ טען מוצרים כשמתחברים
  useEffect(() => {
    if (isLoggedIn) {
      loadProducts();
    }
  }, [isLoggedIn]);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const products = await getProducts();
      
      const formattedProducts = products.map(p => ({
        id: p.id,
        name: p.name,
        quantity: p.quantity,
        unit: "ק''ג",
        minQuantity: 5,
        category: p.category || 'other',
        supplierId: 'sup1'
      }));
      
      setInventory(formattedProducts);
      setError(null);
    } catch (err) {
      console.error('Error loading products:', err);
      setError('לא הצלחנו לטעון את המוצרים');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (inventory.length > 0) {
      localStorage.setItem('kitchen_inventory', JSON.stringify(inventory));
    }
  }, [inventory]);

  const updateQuantity = async (id, amount) => {
    const item = inventory.find(i => i.id === id);
    if (!item) return;

    const newQuantity = Math.max(0, item.quantity + amount);
    
    try {
      await updateProduct(id, {
        name: item.name,
        category: item.category,
        quantity: newQuantity,
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      });
      
      setInventory(inventory.map(i => 
        i.id === id ? { ...i, quantity: newQuantity } : i
      ));
    } catch (err) {
      console.error('Error updating quantity:', err);
      alert('שגיאה בעדכון הכמות');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setIsLoggedIn(false);
    setInventory([]);
    setCurrentScreen('dashboard');
  };

  // ✅ אם לא מחובר - הצג Login
  if (!isLoggedIn) {
    return <Login onLoginSuccess={() => setIsLoggedIn(true)} />;
  }

  // ✅ אם מחובר - הצג את המערכת
  if (isLoading) {
    return (
      <div className="App" style={{ padding: '50px', textAlign: 'center' }}>
        <h2>טוען מוצרים...</h2>
      </div>
    );
  }

  return (
    <div className="App">
      <header className="main-header">
        <div className="header-content">
          <a href='http://localhost:3000/'><h1>🍳 ניהול מטבח - מערכת ניהול מזווה</h1></a>
          <div className="header-actions">
            {currentScreen !== 'dashboard' && (
              <button className="back-to-dash-btn" onClick={() => setCurrentScreen('dashboard')}>
                ← חזור למסך הראשי
              </button>
            )}
            <button className="logout-btn" onClick={handleLogout}>
              יציאה ({localStorage.getItem('username')})
            </button>
          </div>
        </div>
      </header>

      {error && (
        <div style={{ background: '#ffebee', color: '#c62828', padding: '15px', margin: '20px', borderRadius: '8px' }}>
          ⚠️ {error}
        </div>
      )}

      {currentScreen === 'dashboard' && (
        <Dashboard 
          inventory={inventory} 
          suppliers={suppliers} 
          setCurrentScreen={setCurrentScreen} 
        />
      )}
      
      {currentScreen === 'inventory' && (
        <Inventory 
          inventory={inventory} 
          setInventory={setInventory} 
          suppliers={suppliers} 
          updateQuantity={updateQuantity} 
        />
      )}
      
      {currentScreen === 'suppliers' && (
        <Suppliers 
           suppliers={suppliers} 
          setSuppliers={setSuppliers}
          inventory={inventory} 
        />
      )}
    </div>
  );
}

export default App;