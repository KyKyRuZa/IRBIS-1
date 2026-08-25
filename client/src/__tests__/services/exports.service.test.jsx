import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportsService } from '@/lib/services/exports.service.js';
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
  { name: 'exportEmployeeCard', http: 'get', args: [1], expected: ['/api/export/employee-card/1', { responseType: 'blob' }], sample: 'blob' },
  { name: 'exportConsumables', http: 'get', args: [1, 'second'], expected: ['/api/export/consumables/1', { params: { period: 'second' }, responseType: 'blob' }], sample: 'blob' },
  { name: 'exportAllCards', http: 'get', args: [], expected: ['/api/export/all-cards', { responseType: 'blob' }], sample: 'blob' },
  { name: 'exportIssuesReport', http: 'get', args: [], expected: ['/api/export/issues-report', { responseType: 'blob' }], sample: 'blob' },
  { name: 'exportExpiringReport', http: 'get', args: [], expected: ['/api/export/expiring-report', { responseType: 'blob' }], sample: 'blob' },
  { name: 'exportItemsReport', http: 'get', args: [], expected: ['/api/export/items-report', { responseType: 'blob' }], sample: 'blob' },
  { name: 'exportGroupConsumables', http: 'get', args: [1], expected: ['/api/export/group-consumables', { params: { site_id: 1 }, responseType: 'blob' }], sample: 'blob' },
];

describe('exportsService', () => {
  beforeEach(() => vi.clearAllMocks());

  specs.forEach(({ name, http, args, expected, sample }) => {
    it(`${name}() returns data on success`, async () => {
      api[http].mockResolvedValue({ data: sample });
      const result = await exportsService[name](...args);
      expect(result).toEqual(sample);
      expect(api[http]).toHaveBeenCalledWith(...expected);
    });

    it(`${name}() propagates errors`, async () => {
      api[http].mockRejectedValue(new Error('boom'));
      await expect(exportsService[name](...args)).rejects.toThrow('boom');
    });
  });

  it('exportConsumables() defaults period to "first"', async () => {
    api.get.mockResolvedValue({ data: 'blob' });
    await exportsService.exportConsumables(1);
    expect(api.get).toHaveBeenCalledWith('/api/export/consumables/1', { params: { period: 'first' }, responseType: 'blob' });
  });
});
