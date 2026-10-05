import api from './api';

export const laundryService = {
  getAll: (params) => api.get('/laundry', { params }),
  create: (data) => api.post('/laundry', data),
  updateStatus: (id, status) => api.patch(`/laundry/${id}/status`, { status }),
};