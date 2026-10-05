import api from './api';

export const attendanceService = {
  assignShift: (data) => api.post('/attendance/shifts', data),
  getShifts: (params) => api.get('/attendance/shifts', { params }),
  deleteShift: (id) => api.delete(`/attendance/shifts/${id}`),

  markAttendance: (data) => api.post('/attendance/mark', data),
  getAttendance: (params) => api.get('/attendance', { params }),
  getReport: (params) => api.get('/attendance/report', { params }),

  requestLeave: (data) => api.post('/attendance/leave', data),
  getLeaveRequests: (params) => api.get('/attendance/leave', { params }),
  approveLeave: (id) => api.patch(`/attendance/leave/${id}/approve`),
  rejectLeave: (id, rejectionReason) => api.patch(`/attendance/leave/${id}/reject`, { rejectionReason }),
};