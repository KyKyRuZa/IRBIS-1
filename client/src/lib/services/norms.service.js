import { api } from '@/lib/api.js';

export const normsService = {
  list: () =>
    api.get('/api/norms').then(r => r.data),

  get: (id) =>
    api.get(`/api/norms/${id}`).then(r => r.data),

  create: (data) =>
    api.post('/api/norms', data).then(r => r.data),

  update: (id, data) =>
    api.put(`/api/norms/${id}`, data).then(r => r.data),

  delete: (id) =>
    api.delete(`/api/norms/${id}`).then(r => r.data),

  getByEmployee: (employeeId) =>
    api.get(`/api/norms/employee/${employeeId}`).then(r => r.data),
};
