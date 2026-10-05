import api from './api';

export const loyaltyService = {
  getMine: () => api.get('/loyalty/mine'),
  redeem: (rewardId) => api.post(`/loyalty/redeem/${rewardId}`),
};