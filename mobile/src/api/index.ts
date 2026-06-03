import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://rentalman.online/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Attach token to every request ────────────────────────────────────────────
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Auto-clear on 401 ────────────────────────────────────────────────────────
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('token');
      await SecureStore.deleteItemAsync('username');
    }
    return Promise.reject(error);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (username: string, password: string) => {
    const form = new FormData();
    form.append('username', username);
    form.append('password', password);
    return api.post('/auth/login', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  register:       (data: object)          => api.post('/auth/register', data),
  me:             ()                      => api.get('/auth/me'),
  forgotPassword: (email: string)         => api.post('/auth/forgot-password', { email }),
};

// ── Tenants ───────────────────────────────────────────────────────────────────
export const tenantsApi = {
  getAll:  (skip = 0, limit = 50)       => api.get('/tenants/', { params: { skip, limit } }),
  getById: (id: number)                 => api.get(`/tenants/${id}`),
  create:  (data: object)               => api.post('/tenants/', data),
  update:  (id: number, data: object)   => api.put(`/tenants/${id}`, data),
  delete:  (id: number)                 => api.delete(`/tenants/${id}`),
};

// ── Units ─────────────────────────────────────────────────────────────────────
export const unitsApi = {
  getAll:  (skip = 0, limit = 50)       => api.get('/units/', { params: { skip, limit } }),
  getById: (id: number)                 => api.get(`/units/${id}`),
  create:  (data: object)               => api.post('/units/', data),
  update:  (id: number, data: object)   => api.put(`/units/${id}`, data),
  delete:  (id: number)                 => api.delete(`/units/${id}`),
};

// ── Leases ────────────────────────────────────────────────────────────────────
export const leasesApi = {
  getAll:  (skip = 0, limit = 50)       => api.get('/leases/', { params: { skip, limit } }),
  create:  (data: object)               => api.post('/leases/', data),
  update:  (id: number, data: object)   => api.put(`/leases/${id}`, data),
  delete:  (id: number)                 => api.delete(`/leases/${id}`),
};

// ── Payments ──────────────────────────────────────────────────────────────────
export const paymentsApi = {
  getAll:  (skip = 0, limit = 50, status?: string) =>
    api.get('/payments/', { params: { skip, limit, ...(status ? { status } : {}) } }),
  record:  (scheduleId: number, data: object)      => api.post(`/payments/${scheduleId}/record`, data),
  revert:  (scheduleId: number)                    => api.post(`/payments/${scheduleId}/revert`),
};

// ── Expenses ──────────────────────────────────────────────────────────────────
export const expensesApi = {
  getAll:  (unitId?: number, skip = 0, limit = 50) =>
    api.get('/expenses/', { params: { skip, limit, ...(unitId ? { unit_id: unitId } : {}) } }),
  create:  (data: object)                          => api.post('/expenses/', data),
  update:  (id: number, data: object)              => api.put(`/expenses/${id}`, data),
  delete:  (id: number)                            => api.delete(`/expenses/${id}`),
};

// ── Statements ────────────────────────────────────────────────────────────────
export const statementsApi = {
  getStatement: (tenantId: number) => api.get(`/statements/${tenantId}`),
};

export default api;
