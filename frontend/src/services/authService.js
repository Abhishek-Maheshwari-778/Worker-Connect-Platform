import api from './api';

const authService = {
  register:       (data)          => api.post('/auth/register',   data),
  login:          (data)          => api.post('/auth/login',       data),
  logout:         ()              => api.post('/auth/logout'),
  getMe:          ()              => api.get('/auth/me'),
  checkEmail:     (email)         => api.post('/auth/check-email', { email }),
  verifyEmail:    (token)         => api.get(`/auth/verify-email/${token}`),
  forgotPassword: (email)         => api.post('/auth/forgot-password', { email }),
  resetPassword:  (token, password) => api.put(`/auth/reset-password/${token}`, { password }),
  updatePassword: (data)          => api.put('/auth/update-password', data),
};

export default authService;