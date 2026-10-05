import api from './api';

export const reportsService = {
  getOverview: (params) => api.get('/reports/overview', { params }),
  getHotel: (params) => api.get('/reports/hotel', { params }),
  getFinancial: (params) => api.get('/reports/financial', { params }),
  getRestaurant: (params) => api.get('/reports/restaurant', { params }),
  getHousekeeping: (params) => api.get('/reports/housekeeping', { params }),
  getMaintenance: (params) => api.get('/reports/maintenance', { params }),
  getInventory: (params) => api.get('/reports/inventory', { params }),
};