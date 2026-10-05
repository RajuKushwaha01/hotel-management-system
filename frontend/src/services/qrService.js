import api from './api';

export const qrService = {
  getMenu: (tableId) => api.get(`/qr/menu/${tableId}`),
  placeOrder: (tableId, data) => api.post(`/qr/menu/${tableId}/order`, data),
  getOrderStatus: (orderId) => api.get(`/qr/order-status/${orderId}`),

  getRoomInfo: (roomNumber) => api.get(`/qr/room/${roomNumber}`),
  getRoomServiceMenu: () => api.get('/qr/room-service-menu'),
  requestHousekeeping: (roomNumber) => api.post(`/qr/room/${roomNumber}/housekeeping`),
  contactReception: (roomNumber, message) => api.post(`/qr/room/${roomNumber}/reception`, { message }),
  orderRoomService: (roomNumber, items) => api.post(`/qr/room/${roomNumber}/room-service`, { items }),

  verifyInvoice: (code) => api.get(`/qr/verify-invoice/${code}`),
};