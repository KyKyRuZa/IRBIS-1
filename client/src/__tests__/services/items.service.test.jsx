import { describe, it, expect, vi, beforeEach } from 'vitest';
import { itemsService } from '@/lib/services/items.service.js';
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
  { name: 'list', http: 'get', args: ['clothing'], expected: ['/api/items', { params: { category: 'clothing' } }], sample: [{ id: 1 }] },
  { name: 'get', http: 'get', args: [4], expected: ['/api/items/4'], sample: { id: 4 } },
  { name: 'create', http: 'post', args: [{ name: 'x' }], expected: ['/api/items', { name: 'x' }], sample: { id: 1 } },
  { name: 'update', http: 'put', args: [4, { name: 'y' }], expected: ['/api/items/4', { name: 'y' }], sample: { id: 4 } },
  { name: 'delete', http: 'delete', args: [4], expected: ['/api/items/4'], sample: { id: 4 } },
  { name: 'listRequiringCertificates', http: 'get', args: [], expected: ['/api/items', { params: { requires_certificate: true } }], sample: [{ id: 1 }] },
];

describe('itemsService', () => {
  beforeEach(() => vi.clearAllMocks());

  specs.forEach(({ name, http, args, expected, sample }) => {
    it(`${name}() returns data on success`, async () => {
      api[http].mockResolvedValue({ data: sample });
      const result = await itemsService[name](...args);
      expect(result).toEqual(sample);
      expect(api[http]).toHaveBeenCalledWith(...expected);
    });

    it(`${name}() propagates errors`, async () => {
      api[http].mockRejectedValue(new Error('boom'));
      await expect(itemsService[name](...args)).rejects.toThrow('boom');
    });
  });

  it('list() sends empty params when no category is given', async () => {
    api.get.mockResolvedValue({ data: [] });
    await itemsService.list();
    expect(api.get).toHaveBeenCalledWith('/api/items', { params: {} });
  });
});
