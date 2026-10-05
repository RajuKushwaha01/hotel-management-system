import api from './api';

export const permissionsService = {
  getMatrix: () => api.get('/permissions/matrix'),
  getMine: () => api.get('/permissions/mine'),
};