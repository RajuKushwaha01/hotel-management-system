import api from './api';

export const documentService = {
  getTypes: () => api.get('/documents/types'),
  list: (params) => api.get('/documents', { params }),
  upload: (formData) =>
    api.post('/documents', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  // Fetched with the auth header as a blob, so the token is never placed in a URL
  getFile: (id, download = false) =>
    api.get(`/documents/${id}/file`, { params: download ? { download: 'true' } : {}, responseType: 'blob' }),
  getAccessLog: (id) => api.get(`/documents/${id}/access-log`),
  remove: (id) => api.delete(`/documents/${id}`),
};