import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401 unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ── Auth ──────────────────────────────────────────────
export const login = (email, password) =>
  api.post('/auth/login', { email, password });

export const register = (name, email, password, role) =>
  api.post('/auth/register', { name, email, password, role });

// ── Disasters ─────────────────────────────────────────
export const getDisasters = () => api.get('/disasters');

export const getDisaster = (id) => api.get(`/disasters/${id}`);

export const createDisaster = (data) => api.post('/disasters', data);

export const updateDisaster = (id, data) => api.put(`/disasters/${id}`, data);

export const deleteDisaster = (id) => api.delete(`/disasters/${id}`);

// ── Grids ─────────────────────────────────────────────
export const getGrids = (disasterId) => {
  const params = disasterId ? { disaster_id: disasterId } : {};
  return api.get('/grids', { params });
};

export const createGrid = (data) => api.post('/grids', data);

export const updateGrid = (id, data) => api.put(`/grids/${id}`, data);

// ── Assignments ───────────────────────────────────────
export const getAssignments = () => api.get('/assignments');

export const createAssignment = (data) => api.post('/assign', data);

// ── SOS ───────────────────────────────────────────────
export const getSOSRequests = () => api.get('/sos');

export const submitSOS = (data) => api.post('/sos', data);

export const updateSOSStatus = (id, status) =>
  api.put(`/sos/${id}/status`, { status });

// ── AI Prediction ─────────────────────────────────────
export const predictPriority = (gridId) =>
  api.post('/predict-priority', { grid_id: gridId });

// ── Health ────────────────────────────────────────────
export const checkHealth = () => api.get('/health');

export default api;
