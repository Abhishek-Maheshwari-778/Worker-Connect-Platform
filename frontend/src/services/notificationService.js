import api from './api';

const notificationService = {
  getAll:       (params)    => api.get('/notifications', { params }),
  getUnreadCount: ()        => api.get('/notifications/unread-count'),
  markRead:     (id)        => api.put(`/notifications/${id}/read`),
  markAllRead:  ()          => api.put('/notifications/mark-all-read'),
  hide:         (id)        => api.delete(`/notifications/${id}`),
  clearAll:     ()          => api.delete('/notifications/clear-all'),
  handleAction: (id, data)  => api.put(`/notifications/${id}/action`, data),
};

export default notificationService;