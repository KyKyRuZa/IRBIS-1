import { describe, it, expect, vi, beforeEach } from 'vitest';
import { reportsService } from '@/lib/services/reports.service.js';
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
  { name: 'exportExcel', http: 'get', args: [{ site_id: 1 }], expected: ['/api/reports/excel', { params: { site_id: 1 }, responseType: 'blob' }], sample: 'blob' },
  { name: 'getDemand', http: 'get', args: [1], expected: ['/api/reports/demand', { params: { site_id: 1 } }], sample: [{ id: 1 }] },
  { name: 'exportDemandExcel', http: 'get', args: [1], expected: ['/api/reports/demand/excel', { params: { site_id: 1 } }], sample: 'blob' },
  { name: 'exportIssuesReport', http: 'get', args: [], expected: ['/api/reports/issues-report', { responseType: 'blob' }], sample: 'blob' },
  { name: 'exportExpiringReport', http: 'get', args: [], expected: ['/api/reports/expiring-report', { responseType: 'blob' }], sample: 'blob' },
];

describe('reportsService', () => {
  beforeEach(() => vi.clearAllMocks());

  specs.forEach(({ name, http, args, expected, sample }) => {
    it(`${name}() returns data on success`, async () => {
      api[http].mockResolvedValue({ data: sample });
      const result = await reportsService[name](...args);
      expect(result).toEqual(sample);
      expect(api[http]).toHaveBeenCalledWith(...expected);
    });

    it(`${name}() propagates errors`, async () => {
      api[http].mockRejectedValue(new Error('boom'));
      await expect(reportsService[name](...args)).rejects.toThrow('boom');
    });
  });

  it('getDemand() omits params when no siteId provided', async () => {
    api.get.mockResolvedValue({ data: [] });
    await reportsService.getDemand();
    expect(api.get).toHaveBeenCalledWith('/api/reports/demand', { params: {} });
  });
});
