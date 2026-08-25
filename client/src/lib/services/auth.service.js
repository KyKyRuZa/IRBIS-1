import { api } from '@/lib/api.js';

export const authService = {
  login: (username, password) =>
    api.post('/api/auth/login', { username, password }).then(r => r.data),

  register: (username, password, role = 'admin') =>
    api.post('/api/auth/register', { username, password, role }).then(r => r.data),

  changePassword: (oldPassword, newPassword) =>
    api.post('/api/auth/change-password', { oldPassword, newPassword }).then(r => r.data),

  me: () =>
    api.get('/api/auth/me').then(r => r.data),

  logout: () =>
    api.post('/api/auth/logout').then(r => r.data),
};
