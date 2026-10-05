import api from './api';

export const nightAuditService = {
  runChecks: (businessDate) => api.get('/night-audit/checks', { params: { businessDate } }),
  closeBusinessDay: (data) => api.post('/night-audit/close', data),
  getHistory: (params) => api.get('/night-audit/history', { params }),
  getReport: (id) => api.get(`/night-audit/${id}`),
};