import api from './api';

const chatService = {
  getOrCreateConversation: (data)          => api.post('/chat/conversations', data),
  getMyConversations:      ()              => api.get('/chat/conversations'),
  getMessages:     (convId, params)        => api.get(`/chat/conversations/${convId}/messages`, { params }),
  sendMessage:     (convId, data)          => api.post(`/chat/conversations/${convId}/messages`, data),
  sendImage:       (convId, formData)      => api.post(`/chat/conversations/${convId}/messages`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  editMessage:     (msgId, content)        => api.put(`/chat/messages/${msgId}`, { content }),
  deleteMessage:      (msgId)    => api.delete(`/chat/messages/${msgId}`),
  deleteConversation: (convId)   => api.delete(`/chat/conversations/${convId}`),
};

export default chatService;