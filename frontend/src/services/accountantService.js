import api from './api';

export const accountantService = {
  getDashboard: () => api.get('/accountant/dashboard'),
  getPayments: (params) => api.get('/accountant/payments', { params }),
  processRefund: (data) => api.post('/accountant/payments/refund', data),
  getInvoice: (bookingId) => api.get(`/accountant/invoices/${bookingId}`),
  applyAdjustment: (bookingId, data) => api.post(`/accountant/invoices/${bookingId}/adjustment`, data),
  getExpenses: (params) => api.get('/accountant/expenses', { params }),
  createExpense: (data) => api.post('/accountant/expenses', data),
  deleteExpense: (id) => api.delete(`/accountant/expenses/${id}`),
  getRevenueReport: (params) => api.get('/accountant/reports/revenue', { params }),
  getProfitLossReport: (params) => api.get('/accountant/reports/profit-loss', { params }),
  getOutstandingReport: () => api.get('/accountant/reports/outstanding'),
};