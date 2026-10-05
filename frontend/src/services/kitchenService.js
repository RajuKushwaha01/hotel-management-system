import api from './api';

export const kitchenService = {
  getKOTs: (params) => api.get('/kitchen/kot', { params }),
  updateKOTStatus: (id, data) => api.patch(`/kitchen/kot/${id}/status`, data),
  updateFoodAvailability: (id, availability) => api.patch(`/kitchen/menu/${id}/availability`, { availability }),
  getInventory: () => api.get('/kitchen/inventory'),
  updateStock: (id, currentStock) => api.patch(`/kitchen/inventory/${id}`, { currentStock }),
};