import axios from 'axios';

export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
export const TOKEN_KEY = 'shareplate_token';

const api = axios.create({ baseURL: `${API_URL}/api`, timeout: 20000 });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const url = error.config?.url || '';
    if (error.response?.status === 401 && !url.includes('/auth/login')) {
      localStorage.removeItem(TOKEN_KEY);
      window.dispatchEvent(new Event('shareplate:logout'));
    }
    return Promise.reject(error);
  }
);

/** Turn any axios/FastAPI error into a readable message. */
export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (!error.response) return 'Cannot reach the server. Check your connection and try again.';
  const detail = error.response.data?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail) && detail.length) {
    return detail
      .map((d) => {
        const field = Array.isArray(d.loc) ? d.loc.filter((p) => p !== 'body').join(' ') : '';
        const msg = String(d.msg || '').replace(/^Value error, /, '');
        return field ? `${field.replace(/_/g, ' ')}: ${msg}` : msg;
      })
      .join('. ');
  }
  return fallback;
}

export const imageUrl = (url) => (!url ? null : /^https?:/.test(url) ? url : `${API_URL}${url}`);

export const authApi = {
  register: (data) => api.post('/auth/register', data).then((r) => r.data),
  login: (data) => api.post('/auth/login', data).then((r) => r.data),
  me: () => api.get('/auth/me').then((r) => r.data),
};

export const usersApi = {
  update: (data) => api.put('/users/me', data).then((r) => r.data),
};

export const foodsApi = {
  browse: (params) => api.get('/foods', { params }).then((r) => r.data),
  mine: (params) => api.get('/foods/my-listings', { params }).then((r) => r.data),
  get: (id) => api.get(`/foods/${id}`).then((r) => r.data),
  create: (data) => api.post('/foods', data).then((r) => r.data),
  update: (id, data) => api.put(`/foods/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/foods/${id}`).then((r) => r.data),
};

export const requestsApi = {
  create: (data) => api.post('/requests', data).then((r) => r.data),
  mine: (params) => api.get('/requests/my-requests', { params }).then((r) => r.data),
  incoming: (params) => api.get('/requests/incoming', { params }).then((r) => r.data),
  approve: (id) => api.patch(`/requests/${id}/approve`).then((r) => r.data),
  reject: (id) => api.patch(`/requests/${id}/reject`).then((r) => r.data),
  cancel: (id) => api.patch(`/requests/${id}/cancel`).then((r) => r.data),
  complete: (id) => api.patch(`/requests/${id}/complete`).then((r) => r.data),
};

export const historyApi = {
  donations: () => api.get('/history/donations').then((r) => r.data),
  requests: () => api.get('/history/requests').then((r) => r.data),
};

export const dashboardApi = {
  donor: () => api.get('/dashboard/donor').then((r) => r.data),
  recipient: () => api.get('/dashboard/recipient').then((r) => r.data),
};

export const uploadApi = {
  image: (file) => {
    const form = new FormData();
    form.append('file', file);
    return api.post('/uploads/image', form).then((r) => r.data.url);
  },
};

export default api;
