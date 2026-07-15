import React, { useState, useEffect, useCallback, useRef } from 'react';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import Suppliers from './components/Suppliers';
import Sidebar from './components/Sidebar';
import Login from './components/Login';
import Toast from './components/Toast';
import TeamManagement from './components/TeamManagement';
import ChangePassword from './components/ChangePassword';
import WeeklyMenu from './components/WeeklyMenu';
import ResetPassword from './components/ResetPassword';
import { getProducts, createProduct, updateProduct, deleteProduct, getDishes } from './api';
import { findSupplierForCategory } from './utils/assignSuppliers';

const SCREEN_LABELS = {
  dashboard: 'לוח הבקרה',
  inventory: 'ניהול מלאי',
  suppliers: 'ספקים והזמנות',
  menu:      'תפריט שבועי',
  team:      'ניהול צוות',
};

const ROLE_CLAIM = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';

const getRoleFromToken = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64));
    return payload[ROLE_CLAIM] || payload.role || 'Employee';
  } catch {
    return 'Employee';
  }
};

let _autoLogoutTimer = null;

const scheduleAutoLogout = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (!payload.exp) return;
    const msUntilExpiry = payload.exp * 1000 - Date.now();
    if (msUntilExpiry <= 0) {
      window.dispatchEvent(new Event('auth-expired'));
      return;
    }
    clearTimeout(_autoLogoutTimer);
    _autoLogoutTimer = setTimeout(() => {
      window.dispatchEvent(new Event('auth-expired'));
    }, Math.min(msUntilExpiry, 2147483647));
  } catch {}
};

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState('Employee');
  const [theme, setTheme] = useState(() => localStorage.getItem('fm_theme') || 'dark');

  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light');
    localStorage.setItem('fm_theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');
  const [currentScreen, setCurrentScreen] = useState(
    () => window.history.state?.screen || 'dashboard'
  );
  const [inventory, setInventory] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [dishes, setDishes] = useState([]);
  const [businessName, setBusinessName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const suppliersAssignedRef = useRef(false);

  const navigate = useCallback((screen) => {
    window.history.pushState({ screen }, '', `#${screen}`);
    setCurrentScreen(screen);
  }, []);

  useEffect(() => {
    const handlePop = (e) => {
      setCurrentScreen(e.state?.screen || 'dashboard');
    };
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []);

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const currentUsername = sessionStorage.getItem('username') || '';

  // ✅ בדוק אם יש Token בהתחלה + הגדר טיימר התנתקות אוטומטית
  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
      setUserRole(getRoleFromToken(token));
      scheduleAutoLogout(token);
    }
  }, []);

  // ✅ האזן לפקיעת Token
  useEffect(() => {
    const handleExpired = () => {
      setIsLoggedIn(false);
      setInventory([]);
      setSuppliers([]);
      setCurrentScreen('dashboard');
      setSessionExpired(true);
      suppliersAssignedRef.current = false;
    };
    window.addEventListener('auth-expired', handleExpired);
    return () => window.removeEventListener('auth-expired', handleExpired);
  }, []);

  // ✅ טען מוצרים, ספקים ומנות כשמתחברים
  useEffect(() => {
    if (isLoggedIn) {
      loadProducts();
      loadSuppliers();
      loadBusinessName();
      getDishes().then(setDishes).catch(() => {});
    }
  }, [isLoggedIn]);

  const loadBusinessName = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      const businessId = payload.businessId;
      if (!businessId) return;
      const res = await fetch('http://localhost:5148/api/Business', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const list = await res.json();
        const biz = list.find(b => b.id === businessId);
        if (biz) setBusinessName(biz.name);
      }
    } catch {}
  };

  const loadSuppliers = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch('http://localhost:5148/api/Suppliers', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSuppliers(data.map(s => ({
          id: s.id,
          name: s.name,
          contact: s.contactPerson,
          phone: s.phone,
          email: s.email,
          address: s.address
        })));
      }
    } catch (err) {
      console.error('Error loading suppliers:', err);
    }
  };

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const products = await getProducts();

      const formattedProducts = products.map(p => ({
        id: p.id,
        name: p.name,
        quantity: p.quantity,
        unit: "ק''ג",
        minQuantity: p.alertBeforeDays ?? 5,
        category: p.category || 'other',
        supplierId: p.supplierId ?? null,
        expiryDate: p.expiryDate ?? null
      }));
      
      setInventory(formattedProducts);
      suppliersAssignedRef.current = false;
      setError(null);
    } catch (err) {
      console.error('Error loading products:', err);
      setError('לא הצלחנו לטעון את המוצרים');
    } finally {
      setIsLoading(false);
    }
  };

  // שייך אוטומטית ספקים למוצרים שמסומנים "ללא ספק" (לפי קטגוריה)
  useEffect(() => {
    if (!isLoggedIn || userRole !== 'Admin') return;
    if (suppliers.length === 0 || inventory.length === 0) return;
    if (suppliersAssignedRef.current) return;

    const supplierIds = new Set(suppliers.map(s => String(s.id)));
    const needsAssign = inventory.filter(
      item => !item.supplierId || !supplierIds.has(String(item.supplierId))
    );
    if (needsAssign.length === 0) {
      suppliersAssignedRef.current = true;
      return;
    }

    suppliersAssignedRef.current = true;

    (async () => {
      const assigned = [];
      for (const item of needsAssign) {
        const supplier = findSupplierForCategory(suppliers, item.category);
        if (!supplier) continue;
        try {
          await updateProduct(item.id, {
            name: item.name,
            category: item.category,
            quantity: item.quantity,
            expiryDate: item.expiryDate
              ? new Date(item.expiryDate).toISOString()
              : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
            alertBeforeDays: item.minQuantity,
            supplierId: String(supplier.id)
          });
          assigned.push({ id: item.id, supplierId: String(supplier.id) });
        } catch (err) {
          console.error('Error assigning supplier to', item.name, err);
        }
      }
      if (assigned.length > 0) {
        setInventory(prev => prev.map(item => {
          const a = assigned.find(x => x.id === item.id);
          return a ? { ...item, supplierId: a.supplierId } : item;
        }));
        showToast(`${assigned.length} מוצרים שויכו לספקים לפי קטגוריה`, 'success');
      }
    })();
  }, [isLoggedIn, userRole, suppliers, inventory, showToast]);

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
        expiryDate: item.expiryDate
          ? new Date(item.expiryDate).toISOString()
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        alertBeforeDays: item.minQuantity,
        supplierId: item.supplierId || null
      });
      
      setInventory(inventory.map(i => 
        i.id === id ? { ...i, quantity: newQuantity } : i
      ));
    } catch (err) {
      console.error('Error updating quantity:', err);
      showToast('שגיאה בעדכון הכמות', 'error');
    }
  };

  const updateProductSupplier = async (id, supplierId) => {
    const item = inventory.find(i => i.id === id);
    if (!item) return;
    try {
      await updateProduct(id, {
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        expiryDate: item.expiryDate
          ? new Date(item.expiryDate).toISOString()
          : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        alertBeforeDays: item.minQuantity,
        supplierId: supplierId || null
      });
      setInventory(prev => prev.map(i =>
        i.id === id ? { ...i, supplierId: supplierId || null } : i
      ));
      showToast('הספק עודכן בהצלחה', 'success');
    } catch (err) {
      console.error('Error updating supplier:', err);
      showToast('שגיאה בעדכון הספק', 'error');
    }
  };

  const handleLogout = () => {
    clearTimeout(_autoLogoutTimer);
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('username');
    setIsLoggedIn(false);
    setInventory([]);
    setSuppliers([]);
    suppliersAssignedRef.current = false;
    setCurrentScreen('dashboard');
  };

  // ✅ בדוק אם יש reset token ב-URL
  const resetToken = new URLSearchParams(window.location.search).get('token');
  if (resetToken) {
    return <ResetPassword token={resetToken} onDone={() => window.location.replace('/')} theme={theme} toggleTheme={toggleTheme} />;
  }

  // ✅ אם לא מחובר - הצג Login
  if (!isLoggedIn) {
    return <Login onLoginSuccess={() => {
      const token = sessionStorage.getItem('token');
      setUserRole(getRoleFromToken(token));
      setIsLoggedIn(true);
      setSessionExpired(false);
    }} onTokenReceived={scheduleAutoLogout} sessionExpired={sessionExpired} theme={theme} toggleTheme={toggleTheme} />;
  }

  // ✅ אם מחובר - הצג את המערכת
  if (isLoading) {
    return (
      <div className="App app-loading">
        <h2>טוען...</h2>
      </div>
    );
  }

  const _today = new Date(); _today.setHours(0, 0, 0, 0);
  const lowStockCount = inventory.filter(i => {
    if (i.quantity <= i.minQuantity) return true;
    if (!i.expiryDate) return false;
    const daysLeft = Math.ceil((new Date(i.expiryDate) - _today) / 86400000);
    return daysLeft <= i.minQuantity;
  }).length;

  return (
    <div className="app-layout">
      <Sidebar
        currentScreen={currentScreen}
        navigate={(screen) => { navigate(screen); setSidebarOpen(false); }}
        handleLogout={handleLogout}
        isAdmin={userRole === 'Admin'}
        lowStockCount={lowStockCount}
        setShowChangePassword={setShowChangePassword}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        businessName={businessName}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      <div className="app-main">
        <header className="main-header">
          <div className="header-content">
            <button className="sidebar-toggle" onClick={() => setSidebarOpen(o => !o)}>
              <i className="bi bi-list"></i>
            </button>
            <h1>{SCREEN_LABELS[currentScreen]}</h1>
            {currentScreen === 'dashboard' && (
              <span className="header-welcome">ברוך הבא למטבח שלך 👋</span>
            )}
            <button className="theme-toggle-pill" onClick={toggleTheme} title={theme === 'dark' ? 'מצב בהיר' : 'מצב כהה'}>
              <span className="theme-toggle-thumb">
                <i className={`bi ${theme === 'dark' ? 'bi-moon-stars-fill' : 'bi-brightness-high-fill'}`}></i>
              </span>
            </button>
          </div>
        </header>

        {error && <div className="app-error">⚠️ {error}</div>}

        {currentScreen === 'dashboard' && (
          <Dashboard
            setCurrentScreen={navigate}
            isAdmin={userRole === 'Admin'}
            lowStockCount={lowStockCount}
            inventory={inventory}
            suppliers={suppliers}
            dishes={dishes}
          />
        )}

        {currentScreen === 'inventory' && (
          <Inventory
            inventory={inventory}
            setInventory={setInventory}
            suppliers={suppliers}
            updateQuantity={updateQuantity}
            updateProductSupplier={updateProductSupplier}
            showToast={showToast}
            isAdmin={userRole === 'Admin'}
          />
        )}

        {currentScreen === 'suppliers' && (
          <Suppliers
            suppliers={suppliers}
            setSuppliers={setSuppliers}
            inventory={inventory}
            showToast={showToast}
            isAdmin={userRole === 'Admin'}
          />
        )}

        {currentScreen === 'team' && (
          <TeamManagement showToast={showToast} currentUsername={currentUsername} />
        )}

        {currentScreen === 'menu' && (
          <WeeklyMenu inventory={inventory} isAdmin={userRole === 'Admin'} showToast={showToast} />
        )}

        {showChangePassword && (
          <ChangePassword onClose={() => setShowChangePassword(false)} showToast={showToast} />
        )}

        <Toast toasts={toasts} removeToast={removeToast} />
      </div>
    </div>
  );
}

export default App;
