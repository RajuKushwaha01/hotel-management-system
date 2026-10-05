import api from './api';

export const receptionistService = {
  getDashboard: () => api.get('/receptionist/dashboard'),
  checkAvailability: (params) => api.get('/receptionist/availability', { params }),

  searchBookings: (params) => api.get('/receptionist/bookings', { params }),
  getCalendar: (params) => api.get('/receptionist/bookings/calendar', { params }),
  createBooking: (data) => api.post('/receptionist/bookings', data),
  modifyBooking: (id, data) => api.put(`/receptionist/bookings/${id}`, data),
  cancelBooking: (id) => api.patch(`/receptionist/bookings/${id}/cancel`),

  checkIn: (id, data) => api.patch(`/receptionist/bookings/${id}/check-in`, data),
  changeRoom: (id, data) => api.patch(`/receptionist/bookings/${id}/change-room`, data),
  extendStay: (id, data) => api.patch(`/receptionist/bookings/${id}/extend-stay`, data),
  addGuest: (id, data) => api.patch(`/receptionist/bookings/${id}/add-guest`, data),

  getFolio: (id) => api.get(`/receptionist/bookings/${id}/folio`),
  addCharge: (id, data) => api.post(`/receptionist/bookings/${id}/folio/charge`, data),
  collectPayment: (id, data) => api.post(`/receptionist/bookings/${id}/folio/payment`, data),
  checkOut: (id) => api.patch(`/receptionist/bookings/${id}/check-out`),

  getCalendarGrid: (params) => api.get('/receptionist/reservations/calendar-grid', { params }),
  createGroupBooking: (data) => api.post('/receptionist/reservations/group', data),
  reschedule: (id, data) => api.patch(`/receptionist/bookings/${id}/reschedule`, data),
  markNoShow: (id) => api.patch(`/receptionist/bookings/${id}/no-show`),
};