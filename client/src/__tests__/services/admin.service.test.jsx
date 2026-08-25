import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adminService } from '@/lib/services/admin.service.js';
import { api } from '@/lib/api.js';

vi.mock('@/lib/api.js', () => {
  const api = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  };
  return { api, downloadBlob: vi.fn() };
});

const specs = [
  { name: 'getDemand', http: 'get', args: [1], expected: ['/api/admin/demand', { params: { site_id: 1 } }], sample: [{ id: 1 }] },
  { name: 'getNotifications', http: 'get', args: [], expected: ['/api/admin/notifications'], sample: [{ id: 1 }] },
  { name: 'markNotificationRead', http: 'patch', args: [1], expected: ['/api/admin/notifications/1/read'], sample: { id: 1 } },
  { name: 'markAllNotificationsRead', http: 'patch', args: [], expected: ['/api/admin/notifications/read-all'], sample: { ok: true } },
  { name: 'backupDatabase', http: 'get', args: [], expected: ['/api/admin/backup', { responseType: 'blob' }], sample: 'blob' },
];

describe('adminService', () => {
  beforeEach(() => vi.clearAllMocks());

  specs.forEach(({ name, http, args, expected, sample }) => {
    it(`${name}() returns data on success`, async () => {
      api[http].mockResolvedValue({ data: sample });
      const result = await adminService[name](...args);
      expect(result).toEqual(sample);
      expect(api[http]).toHaveBeenCalledWith(...expected);
    });

    it(`${name}() propagates errors`, async () => {
      api[http].mockRejectedValue(new Error('boom'));
      await expect(adminService[name](...args)).rejects.toThrow('boom');
    });
  });

  it('getDemand() omits params when no siteId provided', async () => {
    api.get.mockResolvedValue({ data: [] });
    await adminService.getDemand();
    expect(api.get).toHaveBeenCalledWith('/api/admin/demand', { params: {} });
  });
});
