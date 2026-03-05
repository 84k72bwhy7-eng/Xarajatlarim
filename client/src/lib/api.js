import axios from 'axios';
import { tg } from './telegram';

const API_URL = import.meta.env.VITE_API_URL || 'https://backend-production-b262.up.railway.app/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor: add token if exists
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Telegram orqali login/registratsiya qilish
export const loginWithTelegram = async () => {
    if (!tg.initData) return null;

    try {
        const response = await api.post('/auth/twa', { initData: tg.initData });
        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        return response.data;
    } catch (error) {
        console.error('TWA Login xatosi:', error);
        throw error;
    }
};

// Oddiy avtorizatsiya funktsiyalari
export const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
};

export const register = async (name, email, password) => {
    const response = await api.post('/auth/register', { name, email, password });
    if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
};

export const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
};

// Data fetcherlari
export const getDashboardSummary = () => api.get('/dashboard/summary');
export const getSafeToSpend = () => api.get('/dashboard/safe-to-spend');
export const getTransactions = (params) => api.get('/transactions', { params });
export const createTransaction = (data) => api.post('/transactions', data);
export const deleteTransaction = (id) => api.delete(`/transactions/${id}`);

// Reports
export const downloadExcelReport = async (month, year) => {
    const token = localStorage.getItem('token');
    const url = `${API_URL}/reports/excel?month=${month}&year=${year}`;

    // Create an invisible link to trigger download since it's a file stream
    const link = document.createElement('a');
    link.href = url;

    // We add token as a query param if using standard link download, OR handle via fetch
    // Better way for authenticated downloads is fetch blob:
    const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) throw new Error('Yuklashda xato');

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    link.href = downloadUrl;
    link.download = `Hisobot_${year}_${month}.xlsx`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
};

// Categories
export const getCategories = () => api.get(`/categories?t=${Date.now()}`);
export const createCategory = (data) => api.post('/categories', data);
export const updateCategory = (id, data) => api.put(`/categories/${id}`, data);
export const deleteCategory = (id) => api.delete(`/categories/${id}`);

// Accounts
export const getAccounts = () => api.get(`/accounts?t=${Date.now()}`);
export const createAccount = (data) => api.post('/accounts', data);
export const updateAccount = (id, data) => api.put(`/accounts/${id}`, data);
export const deleteAccount = (id) => api.delete(`/accounts/${id}`);

export const getBudgets = () => api.get('/budgets');
export const createBudget = (data) => api.post('/budgets', data);

// Profile
export const getProfile = () => api.get('/profile');
export const updateProfile = async (data) => {
    const response = await api.put('/profile', data);
    if (response.data) {
        localStorage.setItem('user', JSON.stringify(response.data));
    }
    return response.data;
};
export const changeCurrency = async (targetCurrency) => {
    const response = await api.put('/profile/change-currency', { targetCurrency });
    return response.data;
};
export const getExchangeRate = () => api.get('/profile/exchange-rate');
export const updatePassword = (data) => api.put('/profile/password', data);

// Debts (Qarzlar)
export const getDebts = () => api.get('/debts');
export const createDebt = (data) => api.post('/debts', data);
export const updateDebt = (id, data) => api.put(`/debts/${id}`, data);
export const payDebt = (id, payAmount) => api.put(`/debts/${id}/pay`, { payAmount });
export const deleteDebt = (id) => api.delete(`/debts/${id}`);

// Goals (Maqsadlar)
export const getGoals = () => api.get('/goals');
export const createGoal = (data) => api.post('/goals', data);
export const updateGoal = (id, data) => api.put(`/goals/${id}`, data);
export const addToGoal = (id, addAmount) => api.put(`/goals/${id}/add`, { addAmount });
export const deleteGoal = (id) => api.delete(`/goals/${id}`);

// Admin
export const getAdminUsers = () => api.get('/admin/users');
export const updateAdminUserRole = (id, role) => api.put(`/admin/users/${id}/role`, { role });
export const deleteAdminUser = (id) => api.delete(`/admin/users/${id}`);
export const getAdminStats = () => api.get('/admin/stats');

export default api;
