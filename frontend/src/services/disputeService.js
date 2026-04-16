import api from './api';

const disputeService = {
  raise:        (data)           => api.post('/disputes', data),
  getMyDisputes:(params)         => api.get('/disputes/my', { params }),
  getDispute:   (id)             => api.get(`/disputes/${id}`),
  addMessage:   (id, data)       => api.post(`/disputes/${id}/messages`, data),
  rateResolution:(id, data)      => api.post(`/disputes/${id}/rate`, data),
  // Admin
  getAllAdmin:   (params)        => api.get('/disputes/admin/all', { params }),
  review:       (id, data)       => api.put(`/disputes/${id}/review`, data),
  markViewed:   (id)             => api.post(`/disputes/${id}/mark-viewed`),
};

export default disputeService;