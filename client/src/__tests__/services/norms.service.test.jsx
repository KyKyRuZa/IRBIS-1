import { describe, it, expect, vi, beforeEach } from 'vitest';
import { normsService } from '@/lib/services/norms.service.js';
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
  { name: 'list', http: 'get', args: [], expected: ['/api/norms'], sample: [{ id: 1 }] },
  { name: 'get', http: 'get', args: [2], expected: ['/api/norms/2'], sample: { id: 2 } },
  { name: 'create', http: 'post', args: [{ item_id: 1 }], expected: ['/api/norms', { item_id: 1 }], sample: { id: 1 } },
  { name: 'update', http: 'put', args: [2, { qty: 3 }], expected: ['/api/norms/2', { qty: 3 }], sample: { id: 2 } },
  { name: 'delete', http: 'delete', args: [2], expected: ['/api/norms/2'], sample: { id: 2 } },
  { name: 'getByEmployee', http: 'get', args: [2], expected: ['/api/norms/employee/2'], sample: [{ id: 1 }] },
];

describe('normsService', () => {
  beforeEach(() => vi.clearAllMocks());

  specs.forEach(({ name, http, args, expected, sample }) => {
    it(`${name}() returns data on success`, async () => {
      api[http].mockResolvedValue({ data: sample });
      const result = await normsService[name](...args);
      expect(result).toEqual(sample);
      expect(api[http]).toHaveBeenCalledWith(...expected);
    });

    it(`${name}() propagates errors`, async () => {
      api[http].mockRejectedValue(new Error('boom'));
      await expect(normsService[name](...args)).rejects.toThrow('boom');
    });
  });
});
