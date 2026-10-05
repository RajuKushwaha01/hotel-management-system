import api from './api';

export const bookingService = {
  getAll: (params) => api.get('/bookings', { params }),
  getById: (id) => api.get(`/bookings/${id}`),
  create: (data) => api.post('/bookings', data),
  cancel: (id) => api.patch(`/bookings/${id}/cancel`),
  checkIn: (id) => api.patch(`/bookings/${id}/checkin`),
  checkOut: (id) => api.patch(`/bookings/${id}/checkout`),
};