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
export const getCategories = () => api.get('/categories');
export const getAccounts = () => api.get('/accounts');
export const getBudgets = () => api.get('/budgets');
export const createBudget = (data) => api.post('/budgets', data);

export default api;
