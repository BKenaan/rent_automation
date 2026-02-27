import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor to add JWT
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const authApi = {
    login: (formData) => api.post('/auth/login', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    register: (data) => api.post('/auth/register', data),
    forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
    resetPassword: (token, new_password) => api.post('/auth/reset-password', { token, new_password }),
};

export const tenantsApi = {
    getAll: () => api.get('/tenants/'),
    getById: (id) => api.get(`/tenants/${id}`),
    create: (data) => api.post('/tenants/', data),
    update: (id, data) => api.put(`/tenants/${id}`, data),
    delete: (id) => api.delete(`/tenants/${id}`),
};

export const unitsApi = {
    getAll: () => api.get('/units/'),
    getById: (id) => api.get(`/units/${id}`),
    create: (data) => api.post('/units/', data),
    update: (id, data) => api.put(`/units/${id}`, data),
    delete: (id) => api.delete(`/units/${id}`),
};

export const leasesApi = {
    getAll: () => api.get('/leases/'),
    create: (data) => api.post('/leases/', data),
    update: (id, data) => api.put(`/leases/${id}`, data),
    delete: (id) => api.delete(`/leases/${id}`),
};

export const paymentsApi = {
    getAll: () => api.get('/payments/'),
    record: (scheduleId, data) => api.post(`/payments/${scheduleId}/record`, data),
};

export const expensesApi = {
    getAll: (unitId) => api.get('/expenses/', { params: { unit_id: unitId } }),
    create: (data) => api.post('/expenses/', data),
    update: (id, data) => api.put(`/expenses/${id}`, data),
    delete: (id) => api.delete(`/expenses/${id}`),
};

export const statementsApi = {
    getStatement: (tenantId) => api.get(`/statements/${tenantId}`),
    downloadPdf: (tenantId) => api.get(`/statements/${tenantId}/download`, { responseType: 'blob' }),
};

export default api;
