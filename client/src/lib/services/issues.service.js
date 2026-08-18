import { api } from '@/lib/api.js';

export const issuesService = {
  list: (params = {}) =>
    api.get('/api/issues', { params }).then(r => r.data),

  get: (id) =>
    api.get(`/api/issues/${id}`).then(r => r.data),

  create: (data) =>
    api.post('/api/issues', data).then(r => r.data),

  update: (id, data) =>
    api.put(`/api/issues/${id}`, data).then(r => r.data),

  delete: (id) =>
    api.delete(`/api/issues/${id}`).then(r => r.data),

  batchCreate: (data) =>
    api.post('/api/issues/batch', data).then(r => r.data),

  dispose: (id) =>
    api.patch(`/api/issues/${id}/dispose`).then(r => r.data),

  returnItem: (id) =>
    api.patch(`/api/issues/${id}/return`).then(r => r.data),

  getExpiring: (months = 2) =>
    api.get('/api/issues/expiring', { params: { months } }).then(r => r.data),
};
