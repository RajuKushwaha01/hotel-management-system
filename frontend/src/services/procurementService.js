import api from './api';

export const procurementService = {
  getSuppliers: () => api.get('/procurement/suppliers'),
  createSupplier: (data) => api.post('/procurement/suppliers', data),
  updateSupplier: (id, data) => api.put(`/procurement/suppliers/${id}`, data),
  getSupplierHistory: (id) => api.get(`/procurement/suppliers/${id}/history`),

  getRequests: (params) => api.get('/procurement/requests', { params }),
  createRequest: (data) => api.post('/procurement/requests', data),
  approveRequest: (id) => api.patch(`/procurement/requests/${id}/approve`),
  rejectRequest: (id, rejectionReason) => api.patch(`/procurement/requests/${id}/reject`, { rejectionReason }),

  getOrders: (params) => api.get('/procurement/orders', { params }),
  createOrder: (data) => api.post('/procurement/orders', data),
  sendToSupplier: (id) => api.patch(`/procurement/orders/${id}/send`),
  receiveGoods: (id) => api.patch(`/procurement/orders/${id}/receive`),
  closeOrder: (id) => api.patch(`/procurement/orders/${id}/close`),
};