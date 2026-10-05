import api from './api';

export const transportService = {
  getAll: (params) => api.get('/transport', { params }),
  create: (data) => api.post('/transport', data),
  assignDriver: (id, data) => api.patch(`/transport/${id}/assign`, data),
  updateStatus: (id, status) => api.patch(`/transport/${id}/status`, { status }),
};