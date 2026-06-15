import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/v1',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Redirect to login on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ── Typed API helpers ──────────────────────────────────────

export const authApi = {
  register: (data: { email: string; password: string; name: string }) =>
    api.post('/auth/register', data).then(r => r.data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data).then(r => r.data),
  me: () => api.get('/auth/me').then(r => r.data),
};

export const clientsApi = {
  list: (params?: { status?: string; search?: string; page?: number }) =>
    api.get('/clients', { params }).then(r => r.data),
  get: (id: string) => api.get(`/clients/${id}`).then(r => r.data),
  create: (data: { name: string; email: string; company?: string; phone?: string; notes?: string }) =>
    api.post('/clients', data).then(r => r.data),
  update: (id: string, data: Partial<{ name: string; email: string; company: string; status: string; notes: string }>) =>
    api.patch(`/clients/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/clients/${id}`),
};

export const workflowsApi = {
  list: () => api.get('/workflows').then(r => r.data),
  get: (id: string) => api.get(`/workflows/${id}`).then(r => r.data),
  create: (data: { name: string; description?: string; steps: unknown[]; is_default?: boolean }) =>
    api.post('/workflows', data).then(r => r.data),
  update: (id: string, data: Partial<{ name: string; description: string; steps: unknown[]; is_default: boolean }>) =>
    api.patch(`/workflows/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/workflows/${id}`),
};

export const runsApi = {
  list: (params?: { status?: string; client_id?: string }) =>
    api.get('/runs', { params }).then(r => r.data),
  get: (id: string) => api.get(`/runs/${id}`).then(r => r.data),
  start: (data: { client_id: string; workflow_id: string }) =>
    api.post('/runs', data).then(r => r.data),
  advance: (id: string) => api.post(`/runs/${id}/advance`).then(r => r.data),
  complete: (id: string) => api.post(`/runs/${id}/complete`).then(r => r.data),
  getDocuments: (runId: string) => api.get(`/runs/${runId}/documents`).then(r => r.data),
  addDocument: (runId: string, data: { type: string; title: string; content?: unknown }) =>
    api.post(`/runs/${runId}/documents`, data).then(r => r.data),
};

export const documentsApi = {
  send: (id: string) => api.post(`/documents/${id}/send`).then(r => r.data),
  sign: (id: string) => api.post(`/documents/${id}/sign`).then(r => r.data),
};

export const billingApi = {
  checkout: (plan: 'starter' | 'pro') =>
    api.post('/billing/checkout', { plan }).then(r => r.data),
  portal: () => api.post('/billing/portal').then(r => r.data),
};

export const dashboardApi = {
  stats: () => api.get('/dashboard/stats').then(r => r.data),
};
