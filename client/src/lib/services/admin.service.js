import { api } from '@/lib/api.js';

export const adminService = {
  getDemand: (siteId) =>
    api.get('/api/admin/demand', { params: siteId ? { site_id: siteId } : {} }).then(r => r.data),

  getNotifications: () =>
    api.get('/api/admin/notifications').then(r => r.data),

  markNotificationRead: (id) =>
    api.patch(`/api/admin/notifications/${id}/read`).then(r => r.data),

  markAllNotificationsRead: () =>
    api.patch('/api/admin/notifications/read-all').then(r => r.data),

  backupDatabase: () =>
    api.get('/api/admin/backup', { responseType: 'blob' }).then(r => r.data),
};
