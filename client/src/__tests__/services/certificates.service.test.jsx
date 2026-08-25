import { describe, it, expect, vi, beforeEach } from 'vitest';
import { certificatesService } from '@/lib/services/certificates.service.js';
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
  { name: 'list', http: 'get', args: [], expected: ['/api/certificates'], sample: [{ id: 1 }] },
  { name: 'get', http: 'get', args: [5], expected: ['/api/certificates/5'], sample: { id: 5 } },
  { name: 'create', http: 'post', args: [{ name: 'x' }], expected: ['/api/certificates', { name: 'x' }], sample: { id: 1 } },
  { name: 'update', http: 'put', args: [5, { name: 'y' }], expected: ['/api/certificates/5', { name: 'y' }], sample: { id: 5 } },
  { name: 'delete', http: 'delete', args: [5], expected: ['/api/certificates/5'], sample: { id: 5 } },
  { name: 'listByItem', http: 'get', args: [5], expected: ['/api/certificates/item/5'], sample: [{ id: 1 }] },
];

describe('certificatesService', () => {
  beforeEach(() => vi.clearAllMocks());

  specs.forEach(({ name, http, args, expected, sample }) => {
    it(`${name}() returns data on success`, async () => {
      api[http].mockResolvedValue({ data: sample });
      const result = await certificatesService[name](...args);
      expect(result).toEqual(sample);
      expect(api[http]).toHaveBeenCalledWith(...expected);
    });

    it(`${name}() propagates errors`, async () => {
      api[http].mockRejectedValue(new Error('boom'));
      await expect(certificatesService[name](...args)).rejects.toThrow('boom');
    });
  });
});
