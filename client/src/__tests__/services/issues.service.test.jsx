import { describe, it, expect, vi, beforeEach } from 'vitest';
import { issuesService } from '@/lib/services/issues.service.js';
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
  { name: 'list', http: 'get', args: [{ status: 'issued' }], expected: ['/api/issues', { params: { status: 'issued' } }], sample: [{ id: 1 }] },
  { name: 'get', http: 'get', args: [8], expected: ['/api/issues/8'], sample: { id: 8 } },
  { name: 'create', http: 'post', args: [{ employee_id: 1 }], expected: ['/api/issues', { employee_id: 1 }], sample: { id: 1 } },
  { name: 'update', http: 'put', args: [8, { qty: 2 }], expected: ['/api/issues/8', { qty: 2 }], sample: { id: 8 } },
  { name: 'delete', http: 'delete', args: [8], expected: ['/api/issues/8'], sample: { id: 8 } },
  { name: 'batchCreate', http: 'post', args: [{ items: [] }], expected: ['/api/issues/batch', { items: [] }], sample: { id: 1 } },
  { name: 'dispose', http: 'patch', args: [8], expected: ['/api/issues/8/dispose'], sample: { id: 8 } },
  { name: 'returnItem', http: 'patch', args: [8], expected: ['/api/issues/8/return'], sample: { id: 8 } },
  { name: 'getExpiring', http: 'get', args: [3], expected: ['/api/issues/expiring', { params: { months: 3 } }], sample: [{ id: 1 }] },
];

describe('issuesService', () => {
  beforeEach(() => vi.clearAllMocks());

  specs.forEach(({ name, http, args, expected, sample }) => {
    it(`${name}() returns data on success`, async () => {
      api[http].mockResolvedValue({ data: sample });
      const result = await issuesService[name](...args);
      expect(result).toEqual(sample);
      expect(api[http]).toHaveBeenCalledWith(...expected);
    });

    it(`${name}() propagates errors`, async () => {
      api[http].mockRejectedValue(new Error('boom'));
      await expect(issuesService[name](...args)).rejects.toThrow('boom');
    });
  });

  it('getExpiring() defaults to 2 months', async () => {
    api.get.mockResolvedValue({ data: [] });
    await issuesService.getExpiring();
    expect(api.get).toHaveBeenCalledWith('/api/issues/expiring', { params: { months: 2 } });
  });
});
