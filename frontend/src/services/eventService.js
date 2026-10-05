import api from './api';

export const eventService = {
  getHalls: () => api.get('/events/halls'),
  createHall: (data) => api.post('/events/halls', data),
  checkAvailability: (params) => api.get('/events/halls/availability', { params }),
  getAll: (params) => api.get('/events', { params }),
  create: (data) => api.post('/events', data),
  update: (id, data) => api.put(`/events/${id}`, data),
  collectAdvance: (id, amount) => api.patch(`/events/${id}/advance-payment`, { amount }),
  updateStatus: (id, status) => api.patch(`/events/${id}/status`, { status }),
  getInvoice: (id) => api.get(`/events/${id}/invoice`),
};