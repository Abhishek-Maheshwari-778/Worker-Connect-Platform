import api from './api';

const userService = {
  // Public
  browseLabourers:        (params)  => api.get('/users/labourers', { params }),
  getLabourPublicProfile: (userId)  => api.get(`/users/labour/${userId}`),

  // Badges & Reputation (used by ReputationCard)
  getUserBadges: (userId) => api.get(`/leaderboard/${userId}/badges`),
  getClientById: (id) => api.get(`/users/client/${id}`),

  // Authenticated
  updateProfile: (data) => api.put('/users/profile', data),
  uploadAvatar:  (formData) =>
    api.put('/users/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),

  // Labour
  updateLabourProfile: (data)     => api.put('/users/labour-profile', data),
  uploadAadhaar:       (formData) =>
    api.put('/users/aadhaar', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  addPortfolioImages:  (formData) =>
    api.post('/users/portfolio', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deletePortfolioImage: (imageId) => api.delete(`/users/portfolio/${imageId}`),

  // Client
  updateClientProfile: (data) => api.put('/users/client-profile', data),
  uploadClientAadhaar: (formData) =>
    api.put('/users/client-aadhaar', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

export default userService;