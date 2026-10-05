import api from './api';

export const adminService = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (params) => api.get('/admin/users', { params }),
  createUser: (data) => api.post('/admin/users', data),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  toggleStatus: (id) => api.patch(`/admin/users/${id}/toggle-status`),
  resetPassword: (id, newPassword) => api.patch(`/admin/users/${id}/reset-password`, { newPassword }),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getAuditLogs: (params) => api.get('/admin/audit-logs', { params }),
};