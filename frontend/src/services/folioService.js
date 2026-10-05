import api from './api';

export const folioService = {
  get: (bookingId) => api.get(`/folios/${bookingId}`),
  addCharge: (bookingId, data) => api.post(`/folios/${bookingId}/charge`, data),
  applyDiscount: (bookingId, data) => api.post(`/folios/${bookingId}/discount`, data),
  collectPayment: (bookingId, data) => api.post(`/folios/${bookingId}/payment`, data),
  getReceipt: (bookingId) => api.get(`/folios/${bookingId}/receipt`),
};