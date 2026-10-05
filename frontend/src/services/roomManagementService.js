import api from './api';

export const roomManagementService = {
  getOverview: () => api.get('/rooms/overview'),
  getAll: (params) => api.get('/rooms', { params }),
  getById: (id) => api.get(`/rooms/${id}`),
  create: (data) => api.post('/rooms', data),
  update: (id, data) => api.put(`/rooms/${id}`, data),
  delete: (id) => api.delete(`/rooms/${id}`),
  updateStatus: (id, data) => api.patch(`/rooms/${id}/status`, data),
};