import { api } from '@/lib/api.js';

export const formsService = {
  list: () =>
    api.get('/api/forms').then(r => r.data),

  get: (id) =>
    api.get(`/api/forms/${id}`).then(r => r.data),

  create: (data) =>
    api.post('/api/forms', data).then(r => r.data),

  update: (id, data) =>
    api.put(`/api/forms/${id}`, data).then(r => r.data),

  delete: (id) =>
    api.delete(`/api/forms/${id}`).then(r => r.data),

  take: (data) =>
    api.post('/api/forms/take', data).then(r => r.data),

  listTaken: () =>
    api.get('/api/forms/taken').then(r => r.data),

  listTakenByEmployee: (employeeId) =>
    api.get(`/api/forms/taken/${employeeId}`).then(r => r.data),
};
