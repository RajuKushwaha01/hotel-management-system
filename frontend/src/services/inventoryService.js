import api from './api';

export const inventoryService = {
  getDashboard: () => api.get('/inventory/dashboard'),
  getCategories: () => api.get('/inventory/categories'),
  getLowStock: () => api.get('/inventory/low-stock'),
  getItems: (params) => api.get('/inventory/items', { params }),
  createItem: (data) => api.post('/inventory/items', data),
  updateItem: (id, data) => api.put(`/inventory/items/${id}`, data),
  deleteItem: (id) => api.delete(`/inventory/items/${id}`),
  getItemHistory: (itemId) => api.get(`/inventory/items/${itemId}/history`),
  stockIn: (data) => api.post('/inventory/stock-in', data),
  stockOut: (data) => api.post('/inventory/stock-out', data),
  recordWastage: (data) => api.post('/inventory/wastage', data),
};