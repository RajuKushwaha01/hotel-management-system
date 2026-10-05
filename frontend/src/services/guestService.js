import api from './api';

export const guestService = {
  search: (params) => api.get('/guests', { params }),
  create: (data) => api.post('/guests', data),
  update: (id, data) => api.put(`/guests/${id}`, data),
  getProfile: (id) => api.get(`/guests/${id}`),
  getHistory: (id) => api.get(`/guests/${id}/history`),
};