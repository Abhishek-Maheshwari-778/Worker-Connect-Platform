import api from './api';

const ratingService = {
  submitRating:   (data)   => api.post('/ratings', data),
  getUserRatings: (userId, params) => api.get(`/ratings/user/${userId}`, { params }),
};

export default ratingService;
