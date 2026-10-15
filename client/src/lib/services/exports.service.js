import { api } from '@/lib/api.js';

export const exportsService = {
  exportEmployeeCard: (id) =>
    api.get(`/api/export/employee-card/${id}`, { responseType: 'blob' }).then(r => r.data),

  // Лист выдачи: только позиции одной выдачи (issue_date === событие выдачи)
  exportEmployeeSheet: (id, issueDate) =>
    api.get(`/api/export/employee-card/${id}`, {
      params: { part: 'sheet', issue_date: issueDate },
      responseType: 'blob',
    }).then(r => r.data),

  // Все листы выдачи сотрудника за год одним архивом
  exportEmployeeSheets: (id, year) =>
    api.get(`/api/export/employee-card/${id}/sheets`, { params: { year }, responseType: 'blob' }).then(r => r.data),

  // Групповая печать: по листу на каждого сотрудника с выдачей в дату
  exportIssueSheets: (params = {}) =>
    api.get('/api/export/issue-sheets', { params, responseType: 'blob' }).then(r => r.data),

  exportConsumables: (id, period = 'first') =>
    api.get(`/api/export/consumables/${id}`, { params: { period }, responseType: 'blob' }).then(r => r.data),

  exportAllCards: () =>
    api.get('/api/export/all-cards', { responseType: 'blob' }).then(r => r.data),

  exportIssuesReport: () =>
    api.get('/api/export/issues-report', { responseType: 'blob' }).then(r => r.data),

  exportExpiringReport: () =>
    api.get('/api/export/expiring-report', { responseType: 'blob' }).then(r => r.data),

  exportItemsReport: () =>
    api.get('/api/export/items-report', { responseType: 'blob' }).then(r => r.data),

  exportGroupConsumables: (siteId) =>
    api.get('/api/export/group-consumables', { params: { site_id: siteId }, responseType: 'blob' }).then(r => r.data),
};
