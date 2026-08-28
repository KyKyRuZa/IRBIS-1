import { api } from '@/lib/api.js';

export const reportsService = {
  exportExcel: (params = {}) =>
    api.get('/api/reports/excel', { params, responseType: 'blob' }).then(r => r.data),

  getDemand: (siteId) =>
    api.get('/api/reports/demand', { params: siteId ? { site_id: siteId } : {} }).then(r => r.data),

  exportDemandExcel: (siteId) =>
    api.get('/api/reports/demand/excel', { params: siteId ? { site_id: siteId } : {}, responseType: 'blob' }).then(r => r.data),

  exportIssuesReport: () =>
    api.get('/api/reports/issues-report', { responseType: 'blob' }).then(r => r.data),

  exportExpiringReport: () =>
    api.get('/api/reports/expiring-report', { responseType: 'blob' }).then(r => r.data),
};
