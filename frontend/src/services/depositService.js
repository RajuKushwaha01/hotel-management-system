import api from './api';

export const depositService = {
  getAll: (params) => api.get('/deposits', { params }),
  create: (data) => api.post('/deposits', data),
  requestRefund: (id, data) => api.patch(`/deposits/${id}/request-refund`, data),
  approveRefund: (id) => api.patch(`/deposits/${id}/approve-refund`),
  processRefund: (id) => api.patch(`/deposits/${id}/process-refund`),
  rejectRefund: (id, reason) => api.patch(`/deposits/${id}/reject-refund`, { reason }),
};