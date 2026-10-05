import api from './api';

export const workflowService = {
  getHealth: () => api.get('/workflow/health'),
  traceBooking: (bookingId) => api.get(`/workflow/trace/${bookingId}`),
};