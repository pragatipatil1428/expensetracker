import api from './api.js';

export const userService = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (payload) => api.put('/users/profile', payload),
  changePassword: (payload) => api.put('/users/password', payload),
  deleteAccount: () => api.delete('/users/account'),
};
