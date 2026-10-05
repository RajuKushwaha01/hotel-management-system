import api from './api';

export const schemaService = {
  getStats: () => api.get('/schema/stats'),
  getEntityMap: () => api.get('/schema/entities'),
  getCollectionDetail: (modelName) => api.get(`/schema/collections/${modelName}`),
};