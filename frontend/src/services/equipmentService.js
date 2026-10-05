import api from './api';

export const equipmentService = {
  getAll: (params) => api.get('/equipment', { params }),
  create: (data) => api.post('/equipment', data),
  update: (id, data) => api.put(`/equipment/${id}`, data),
  logService: (id, data) => api.patch(`/equipment/${id}/service`, data),
  delete: (id) => api.delete(`/equipment/${id}`),
};