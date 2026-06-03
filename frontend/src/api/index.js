import axios from 'axios';

/**
 * Base URL resolution:
 *  - Dev (Vite):        Vite proxies /api/v1 → http://localhost:8000/api/v1  (see vite.config.js)
 *  - Production:        FastAPI serves frontend + API on the same origin, /api/v1 works directly
 *  - Mobile (Expo):     Set EXPO_PUBLIC_API_URL=https://yourdomain.com/api/v1
 *  - CI / staging:      Override via VITE_API_URL at build time
 */
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api/v1',
    timeout: 15000,  // 15s — critical for mobile on slow networks
    headers: {
        'Content-Type': 'application/json',
    },
});

// ── Attach JWT to every request ───────────────────────────────────────────────
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// ── Auto-logout on 401 (expired / invalid token) ─────────────────────────────
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            // Avoid redirect loops on the public/auth pages
            const path = window.location.pathname;
            if (!['/login', '/register', '/forgot-password', '/reset-password', '/'].includes(path)) {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
    login:          (formData)              => api.post('/auth/login', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    register:       (data)                  => api.post('/auth/register', data),
    me:             ()                      => api.get('/auth/me'),
    forgotPassword: (email)                 => api.post('/auth/forgot-password', { email }),
    resetPassword:  (token, new_password)   => api.post('/auth/reset-password', { token, new_password }),
};

// ── Tenants ───────────────────────────────────────────────────────────────────
export const tenantsApi = {
    getAll:  (skip = 0, limit = 50) => api.get('/tenants/',       { params: { skip, limit } }),
    getById: (id)                   => api.get(`/tenants/${id}`),
    create:  (data)                 => api.post('/tenants/', data),
    update:  (id, data)             => api.put(`/tenants/${id}`, data),
    delete:  (id)                   => api.delete(`/tenants/${id}`),
};

// ── Units ─────────────────────────────────────────────────────────────────────
export const unitsApi = {
    getAll:  (skip = 0, limit = 50) => api.get('/units/',         { params: { skip, limit } }),
    getById: (id)                   => api.get(`/units/${id}`),
    create:  (data)                 => api.post('/units/', data),
    update:  (id, data)             => api.put(`/units/${id}`, data),
    delete:  (id)                   => api.delete(`/units/${id}`),
};

// ── Leases ────────────────────────────────────────────────────────────────────
export const leasesApi = {
    getAll:  (skip = 0, limit = 50) => api.get('/leases/',        { params: { skip, limit } }),
    getById: (id)                   => api.get(`/leases/${id}`),
    create:  (data)                 => api.post('/leases/', data),
    update:  (id, data)             => api.put(`/leases/${id}`, data),
    delete:  (id)                   => api.delete(`/leases/${id}`),
};

// ── Payments ──────────────────────────────────────────────────────────────────
export const paymentsApi = {
    getAll:  (status, skip = 0, limit = 50) => api.get('/payments/', { params: { status, skip, limit } }),
    record:  (scheduleId, data)             => api.post(`/payments/${scheduleId}/record`, data),
    revert:  (scheduleId)                   => api.post(`/payments/${scheduleId}/revert`),
    getById: (scheduleId)                   => api.get(`/payments/${scheduleId}`),
};

// ── Expenses ──────────────────────────────────────────────────────────────────
export const expensesApi = {
    getAll:  (unitId, skip = 0, limit = 50) => api.get('/expenses/', { params: { unit_id: unitId, skip, limit } }),
    create:  (data)                         => api.post('/expenses/', data),
    update:  (id, data)                     => api.put(`/expenses/${id}`, data),
    delete:  (id)                           => api.delete(`/expenses/${id}`),
};

// ── Statements ────────────────────────────────────────────────────────────────
export const statementsApi = {
    getStatement: (tenantId) => api.get(`/statements/${tenantId}`),
    downloadPdf:  (tenantId) => api.get(`/statements/${tenantId}/download`, { responseType: 'blob', timeout: 30000 }),
};

export default api;
