import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sitesService } from '@/lib/services/sites.service.js';
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
  { name: 'list', http: 'get', args: [], expected: ['/api/sites'], sample: [{ id: 1 }] },
  { name: 'get', http: 'get', args: [9], expected: ['/api/sites/9'], sample: { id: 9 } },
  { name: 'create', http: 'post', args: [{ name: 'АЗС-1' }], expected: ['/api/sites', { name: 'АЗС-1' }], sample: { id: 1 } },
  { name: 'update', http: 'put', args: [9, { name: 'x' }], expected: ['/api/sites/9', { name: 'x' }], sample: { id: 9 } },
  { name: 'delete', http: 'delete', args: [9], expected: ['/api/sites/9'], sample: { id: 9 } },
];

describe('sitesService', () => {
  beforeEach(() => vi.clearAllMocks());

  specs.forEach(({ name, http, args, expected, sample }) => {
    it(`${name}() returns data on success`, async () => {
      api[http].mockResolvedValue({ data: sample });
      const result = await sitesService[name](...args);
      expect(result).toEqual(sample);
      expect(api[http]).toHaveBeenCalledWith(...expected);
    });

    it(`${name}() propagates errors`, async () => {
      api[http].mockRejectedValue(new Error('boom'));
      await expect(sitesService[name](...args)).rejects.toThrow('boom');
    });
  });
});
