import api from './api';

export const serviceRequestService = {
  getAll: (params) => api.get('/service-requests', { params }),
  create: (data) => api.post('/service-requests', data),
  updateStatus: (id, data) => api.patch(`/service-requests/${id}`, data),
};