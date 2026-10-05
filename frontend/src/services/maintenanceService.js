import api from './api';

export const maintenanceService = {
  getDashboard: () => api.get('/maintenance/dashboard'),
  getTickets: (params) => api.get('/maintenance/tickets', { params }),
  createTicket: (data) => api.post('/maintenance/tickets', data),
  assignTicket: (id, assignedTo) => api.patch(`/maintenance/tickets/${id}/assign`, { assignedTo }),
  startWork: (id) => api.patch(`/maintenance/tickets/${id}/start`),
  completeTicket: (id, data) => api.patch(`/maintenance/tickets/${id}/complete`, data),
  verifyTicket: (id) => api.patch(`/maintenance/tickets/${id}/verify`),
  closeTicket: (id) => api.patch(`/maintenance/tickets/${id}/close`),
};