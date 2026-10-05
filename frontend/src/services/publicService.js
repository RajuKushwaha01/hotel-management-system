import api from './api';

export const publicService = {
  getRooms: (params) => api.get('/public/rooms', { params }),
  getRoomDetails: (id) => api.get(`/public/rooms/${id}`),
  getReviews: () => api.get('/public/reviews'),
};