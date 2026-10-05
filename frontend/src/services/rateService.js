import api from './api';

export const rateService = {
  getRoomRates: () => api.get('/rates/room-rates'),
  upsertRoomRate: (data) => api.put('/rates/room-rates', data),
  getRatePlans: (params) => api.get('/rates/rate-plans', { params }),
  createRatePlan: (data) => api.post('/rates/rate-plans', data),
  updateRatePlan: (id, data) => api.put(`/rates/rate-plans/${id}`, data),
  deleteRatePlan: (id) => api.delete(`/rates/rate-plans/${id}`),
  calculate: (params) => api.get('/rates/calculate', { params }),
};