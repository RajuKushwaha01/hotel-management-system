import api from './api';

export const backupService = {
  getHistory: () => api.get('/backup'),
  run: () => api.post('/backup/run'),
  download: (id) => api.get(`/backup/${id}/download`, { responseType: 'blob' }),
  restore: (id, confirmPhrase) => api.post(`/backup/${id}/restore`, { confirmPhrase }),
};