import { api } from '@/lib/api.js'

export const normTemplatesService = {
  list: () => api.get('/api/norm-templates').then((r) => r.data),

  get: (id) => api.get(`/api/norm-templates/${id}`).then((r) => r.data),

  create: (data) => api.post('/api/norm-templates', data).then((r) => r.data),

  update: (id, data) => api.put(`/api/norm-templates/${id}`, data).then((r) => r.data),

  delete: (id) => api.delete(`/api/norm-templates/${id}`).then((r) => r.data),

  getItems: (id) => api.get(`/api/norm-templates/${id}/items`).then((r) => r.data),

  addItem: (id, data) => api.post(`/api/norm-templates/${id}/items`, data).then((r) => r.data),

  removeItem: (templateId, itemId) =>
    api.delete(`/api/norm-templates/${templateId}/items/${itemId}`).then((r) => r.data),

  getByPosition: (position, gender) =>
    api.get(`/api/norm-templates/by-position/${encodeURIComponent(position)}`, { params: { gender } }).then((r) => r.data),
}
