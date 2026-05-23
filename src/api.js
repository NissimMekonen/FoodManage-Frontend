// API Configuration
const API_URL = 'http://localhost:5148/api';

// Helper function to get token
const getToken = () => localStorage.getItem('token');

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