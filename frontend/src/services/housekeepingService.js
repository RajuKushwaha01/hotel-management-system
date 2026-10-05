import api from './api';

export const housekeepingService = {
  getDashboard: () => api.get('/housekeeping/dashboard'),
  getTasks: (params) => api.get('/housekeeping/tasks', { params }),
  createTask: (data) => api.post('/housekeeping/tasks', data),
  acceptTask: (id) => api.patch(`/housekeeping/tasks/${id}/accept`),
  startCleaning: (id) => api.patch(`/housekeeping/tasks/${id}/start`),
  completeCleaning: (id) => api.patch(`/housekeeping/tasks/${id}/complete`),
  markClean: (id) => api.patch(`/housekeeping/tasks/${id}/mark-clean`),
  reportDamage: (id, description) => api.patch(`/housekeeping/tasks/${id}/report-damage`, { description }),
  reportMissingItem: (id, data) => api.patch(`/housekeeping/tasks/${id}/report-missing-item`, data),

  getInventory: () => api.get('/housekeeping/inventory'),
  updateStock: (id, currentStock) => api.patch(`/housekeeping/inventory/${id}`, { currentStock }),

  getLostFound: (params) => api.get('/housekeeping/lost-found', { params }),
  createLostFound: (data) => api.post('/housekeeping/lost-found', data),
  updateLostFoundStatus: (id, data) => api.patch(`/housekeeping/lost-found/${id}`, data),
};