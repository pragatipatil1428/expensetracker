import api from './api.js';

export const analyticsService = {
  summary: (range) => api.get('/analytics/summary', { params: { range } }),
  monthly: (params) => api.get('/analytics/monthly', { params }),
  categories: (range) => api.get('/analytics/categories', { params: { range } }),
};
