import api from './api';

export const auditService = {
  getLogs: (params) => api.get('/audit-logs', { params }),
  getStats: () => api.get('/audit-logs/stats'),
  getFilters: () => api.get('/audit-logs/filters'),
  exportCsv: (params) => api.get('/audit-logs/export', { params, responseType: 'blob' }),
};