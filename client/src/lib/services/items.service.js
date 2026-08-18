import { api } from '@/lib/api.js';

export const itemsService = {
  list: (category) =>
    api.get('/api/items', { params: category ? { category } : {} }).then(r => r.data),

  get: (id) =>
    api.get(`/api/items/${id}`).then(r => r.data),

  create: (data) =>
    api.post('/api/items', data).then(r => r.data),

  update: (id, data) =>
    api.put(`/api/items/${id}`, data).then(r => r.data),

  delete: (id) =>
    api.delete(`/api/items/${id}`).then(r => r.data),

  listRequiringCertificates: () =>
    api.get('/api/items', { params: { requires_certificate: true } }).then(r => r.data),
};
