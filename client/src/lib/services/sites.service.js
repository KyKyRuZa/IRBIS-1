import { api } from '@/lib/api.js';

export const sitesService = {
  list: () =>
    api.get('/api/sites').then(r => r.data),

  get: (id) =>
    api.get(`/api/sites/${id}`).then(r => r.data),

  create: (data) =>
    api.post('/api/sites', data).then(r => r.data),

  update: (id, data) =>
    api.put(`/api/sites/${id}`, data).then(r => r.data),

  delete: (id) =>
    api.delete(`/api/sites/${id}`).then(r => r.data),
};
