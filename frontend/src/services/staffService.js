import api from './api';

export const staffService = {
  getAll: (params) => api.get('/staff', { params }),
  create: (data) => api.post('/staff', data),
  getProfile: (id) => api.get(`/staff/${id}`),
  update: (id, data) => api.put(`/staff/${id}`, data),
  addDocument: (id, data) => api.post(`/staff/${id}/documents`, data),
  removeDocument: (id, docId) => api.delete(`/staff/${id}/documents/${docId}`),
};