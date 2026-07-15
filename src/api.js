// API Configuration
const API_URL = 'http://localhost:5148/api';

// Helper function to get token
const getToken = () => sessionStorage.getItem('token');

// Helper function for API calls
const apiCall = async (endpoint, options = {}) => {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...(token && {
            'Authorization': `Bearer ${token}`
        }),
        ...options.headers
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers
    });

    if (response.status === 401) {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('username');
        window.dispatchEvent(new Event('auth-expired'));
        throw new Error('401');
    }

    if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
};

// ========== AUTH ==========
export const login = async (username, password) => {
    return apiCall('/Auth/login', {
        method: 'POST',
        body: JSON.stringify({
            username,
            password
        })
    });
};

export const register = async (businessName, username, email, password) => {
    return apiCall('/Auth/register', {
        method: 'POST',
        body: JSON.stringify({
            businessName,
            username,
            email,
            password,
            role: 'Admin'
        })
    });
};

// ========== AUTH - USER MANAGEMENT ==========
export const changePassword = async (currentPassword, newPassword) => {
    return apiCall('/Auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword })
    });
};

export const createUser = async (userData) => {
    return apiCall('/Auth/create-user', {
        method: 'POST',
        body: JSON.stringify(userData)
    });
};

export const getUsers = async () => {
    return apiCall('/Auth/users');
};

export const deleteUser = async (id) => {
    return apiCall(`/Auth/users/${id}`, { method: 'DELETE' });
};

// ========== PRODUCTS ==========
export const getProducts = async () => {
    return apiCall('/Product');
};

export const createProduct = async (product) => {
    return apiCall('/Product', {
        method: 'POST',
        body: JSON.stringify(product)
    });
};

export const updateProduct = async (id, product) => {
    return apiCall(`/Product/${id}`, {
        method: 'PUT',
        body: JSON.stringify(product)
    });
};

export const deleteProduct = async (id) => {
    return apiCall(`/Product/${id}`, {
        method: 'DELETE'
    });
};

// ========== MENU ==========
export const getDishes = async () => apiCall('/Menu');

export const createDish = async (dish) => apiCall('/Menu', { method: 'POST', body: JSON.stringify(dish) });

export const updateDish = async (id, dish) => apiCall(`/Menu/${id}`, { method: 'PUT', body: JSON.stringify(dish) });

export const deleteDish = async (id) => apiCall(`/Menu/${id}`, { method: 'DELETE' });

export const getExpectedGuests = async () => apiCall('/Menu/expected-guests');

export const saveExpectedGuests = async (guests) =>
  apiCall('/Menu/expected-guests', { method: 'PUT', body: JSON.stringify(guests) });

export const checkMenuInventory = async () => apiCall('/Menu/check-inventory');

// ========== WEEKLY SURVIVAL ==========
export const getWeeklySurvival = async () => {
    return apiCall('/Product/weekly-check');
};

export const suggestReplacement = async (productName, category) => {
    return apiCall('/Product/suggest-replacement', {
        method: 'POST',
        body: JSON.stringify({
            productName,
            category
        })
    });
};