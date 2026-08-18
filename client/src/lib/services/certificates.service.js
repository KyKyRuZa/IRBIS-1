import { api } from '@/lib/api.js';

export const certificatesService = {
  list: () =>
    api.get('/api/certificates').then(r => r.data),

  get: (id) =>
    api.get(`/api/certificates/${id}`).then(r => r.data),

  create: (data) =>
    api.post('/api/certificates', data).then(r => r.data),

  update: (id, data) =>
    api.put(`/api/certificates/${id}`, data).then(r => r.data),

  delete: (id) =>
    api.delete(`/api/certificates/${id}`).then(r => r.data),

  listByItem: (itemTypeId) =>
    api.get(`/api/certificates/item/${itemTypeId}`).then(r => r.data),
};
