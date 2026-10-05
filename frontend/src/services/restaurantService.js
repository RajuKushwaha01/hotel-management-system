import api from './api';

export const restaurantService = {
  getTables: () => api.get('/restaurant/tables'),
  createTable: (data) => api.post('/restaurant/tables', data),
  updateTable: (id, data) => api.put(`/restaurant/tables/${id}`, data),
  mergeTables: (data) => api.patch('/restaurant/tables/merge', data),
  splitTables: (id) => api.patch(`/restaurant/tables/${id}/split`),

  getMenu: (params) => api.get('/restaurant/menu', { params }),
  createMenuItem: (data) => api.post('/restaurant/menu', data),
  updateMenuItem: (id, data) => api.put(`/restaurant/menu/${id}`, data),
  deleteMenuItem: (id) => api.delete(`/restaurant/menu/${id}`),

  getOrders: (params) => api.get('/restaurant/orders', { params }),
  createOrder: (data) => api.post('/restaurant/orders', data),
  cancelOrderItem: (id, data) => api.patch(`/restaurant/orders/${id}/cancel-item`, data),
  serveOrder: (id) => api.patch(`/restaurant/orders/${id}/serve`),
  closeOrder: (id, data) => api.patch(`/restaurant/orders/${id}/close`, data),
};