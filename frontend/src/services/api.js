import axios from 'axios';
import { getToken, removeToken } from '../utils/auth';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Axios-Instanz erstellen
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor - Token hinzufügen
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor - Fehlerbehandlung
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token ungültig - ausloggen
      removeToken();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (username, email, password) => api.post('/auth/register', { username, email, password }),
  getMe: () => api.get('/auth/me'),
};

// Items API
export const itemsAPI = {
  getAll: (params) => api.get('/items', { params: params || {} }),
  getById: (id) => api.get(`/items/${id}`),
  create: (data) => api.post('/items', data),
  update: (id, data) => api.put(`/items/${id}`, data),
  delete: (id) => api.delete(`/items/${id}`),
};

// Customers API
export const customersAPI = {
  getAll: () => api.get('/customers'),
  getById: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`),
};

// Bookings API
export const bookingsAPI = {
  getAll: () => api.get('/bookings'),
  getById: (id) => api.get(`/bookings/${id}`),
  create: (data) => api.post('/bookings', data),
  update: (id, data) => api.put(`/bookings/${id}`, data),
  delete: (id) => api.delete(`/bookings/${id}`),
  deleteWithOptions: (id, data) => api.post(`/bookings/delete/${id}`, data),
  sendTeamsInvite: (id, sendToCustomer = false) => api.post(`/bookings/send-teams-invite/${id}`, { sendToCustomer }),
};

// Scanner API
export const scannerAPI = {
  createSession: (bookingId) =>
    api.post('/scanner/sessions', bookingId ? { bookingId } : {}),
  scan: (sessionId, itemId) =>
    api.post(`/scanner/sessions/${sessionId}/scan`, { itemId }),
  getSessionItems: (sessionId) => api.get(`/scanner/sessions/${sessionId}/items`),
};

// Einstellungen API
export const settingsAPI = {
  getEmailRecipients: () => api.get('/settings/email-recipients'),
  updateEmailRecipients: (emails) => api.put('/settings/email-recipients', { emails }),
};

export default api;

