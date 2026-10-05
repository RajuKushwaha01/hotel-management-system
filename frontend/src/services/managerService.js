import api from './api';

export const managerService = {
  getDashboard: () => api.get('/manager/dashboard'),
  getBookings: (params) => api.get('/manager/bookings', { params }),
  approveBooking: (id) => api.patch(`/manager/bookings/${id}/approve`),
  cancelBooking: (id) => api.patch(`/manager/bookings/${id}/cancel`),
  reassignRoom: (id, roomId) => api.patch(`/manager/bookings/${id}/reassign-room`, { roomId }),
};