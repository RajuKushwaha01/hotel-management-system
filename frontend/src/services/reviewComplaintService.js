import api from './api';

export const reviewComplaintService = {
  getReviews: (params) => api.get('/review-complaints/reviews', { params }),
  respondToReview: (id, managerResponse) => api.patch(`/review-complaints/reviews/${id}/respond`, { managerResponse }),
  togglePublish: (id) => api.patch(`/review-complaints/reviews/${id}/toggle-publish`),

  getComplaints: (params) => api.get('/review-complaints/complaints', { params }),
  assignComplaint: (id, assignedTo) => api.patch(`/review-complaints/complaints/${id}/assign`, { assignedTo }),
  respondToComplaint: (id, response) => api.patch(`/review-complaints/complaints/${id}/respond`, { response }),
  resolveComplaint: (id, resolutionNote) => api.patch(`/review-complaints/complaints/${id}/resolve`, { resolutionNote }),
  closeComplaint: (id) => api.patch(`/review-complaints/complaints/${id}/close`),
};