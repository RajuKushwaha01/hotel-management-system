import api from './api';

export const crmService = {
  getDashboard: () => api.get('/crm/dashboard'),
  getFrequentGuests: () => api.get('/crm/frequent-guests'),
  getOccasions: () => api.get('/crm/occasions'),
  getGuestProfile: (id) => api.get(`/crm/guests/${id}`),
};