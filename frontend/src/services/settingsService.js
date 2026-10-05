import api from './api';

export const settingsService = {
  getAll: () => api.get('/settings'),
  update: (key, value) => api.patch(`/settings/${key}`, { value }),
  bulkUpdate: (settings) => api.patch('/settings/bulk', { settings }),
};