import axios from 'axios';

const api = axios.create({
  baseURL:         '/api',
  withCredentials: true,
  headers:         { 'Content-Type': 'application/json' },
  timeout:         60000, // increased to 60 seconds
});

// ── Request interceptor – attach JWT from localStorage ───────────────────────
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor – normalise errors ──────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Connection aborted — server still processing, browser gave up
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return Promise.reject({
        ...error,
        message: 'Request timed out. Please check your connection and try again.',
      });
    }

    // Network error — server not running
    if (!error.response) {
      return Promise.reject({
        ...error,
        message: 'Cannot connect to server. Make sure the backend is running on port 5000.',
      });
    }

    const message =
      error.response?.data?.message ||
      error.response?.data?.error   ||
      error.message                  ||
      'An unexpected error occurred';

    // Auto-logout on 401
    if (error.response?.status === 401) {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }

    // Profile gate blocked — attach blockType so components can handle gracefully
    if (error.response?.status === 403 && error.response?.data?.blocked) {
      return Promise.reject({
        ...error,
        message:   error.response.data.message,
        blocked:   true,
        blockType: error.response.data.blockType,
        action:    error.response.data.action,
        redirectTo:error.response.data.redirectTo,
      });
    }

    return Promise.reject({ ...error, message });
  }
);

export default api;