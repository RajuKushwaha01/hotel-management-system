import api from './api';

export const customerService = {
  getDashboard: () => api.get('/customer/dashboard'),
  checkAvailability: (params) => api.get('/customer/availability', { params }),
  createBooking: (data) => api.post('/customer/bookings', data),
  getMyBookings: () => api.get('/customer/bookings'),
  cancelBooking: (id) => api.patch(`/customer/bookings/${id}/cancel`),
  modifyBooking: (id, data) => api.put(`/customer/bookings/${id}`, data),
  getInvoice: (bookingId) => api.get(`/customer/invoices/${bookingId}`),
  createServiceRequest: (data) => api.post('/customer/service-requests', data),
  getServiceRequests: () => api.get('/customer/service-requests'),
  createComplaint: (data) => api.post('/customer/complaints', data),
  getComplaints: () => api.get('/customer/complaints'),
  createReview: (data) => api.post('/customer/reviews', data),
  getMyReviews: () => api.get('/customer/reviews'),
  updateReview: (id, data) => api.put(`/customer/reviews/${id}`, data),
  deleteReview: (id) => api.delete(`/customer/reviews/${id}`),
  updateProfile: (data) => api.put('/customer/profile', data),
};