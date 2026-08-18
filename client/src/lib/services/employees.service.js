import { api } from '@/lib/api.js';
import { EMPLOYEE_STATUSES } from '@/lib/constants/employee-statuses.js';

export const employeesService = {
  list: (params = {}) =>
    api.get('/api/employees', { params }).then(r => r.data),

  get: (id) =>
    api.get(`/api/employees/${id}`).then(r => r.data),

  create: (data) =>
    api.post('/api/employees', data).then(r => r.data),

  update: (id, data) =>
    api.put(`/api/employees/${id}`, data).then(r => r.data),

  terminate: (id) =>
    api.patch(`/api/employees/${id}/terminate`).then(r => r.data),

  delete: (id) =>
    api.delete(`/api/employees/${id}`).then(r => r.data),

  search: (query) =>
    api.get('/api/employees', { params: { search: query } }).then(r => r.data),

  bySite: (siteId, status = EMPLOYEE_STATUSES.active) =>
    api.get('/api/employees', { params: { site_id: siteId, status } }).then(r => r.data),
};
