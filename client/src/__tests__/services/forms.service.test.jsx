import { describe, it, expect, vi, beforeEach } from 'vitest';
import { formsService } from '@/lib/services/forms.service.js';
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
  { name: 'list', http: 'get', args: [], expected: ['/api/forms'], sample: [{ id: 1 }] },
  { name: 'create', http: 'post', args: [{ name: 'x' }], expected: ['/api/forms', { name: 'x' }], sample: { id: 1 } },
  { name: 'take', http: 'post', args: [{ employee_id: 1 }], expected: ['/api/forms/take', { employee_id: 1 }], sample: { id: 1 } },
  { name: 'listTaken', http: 'get', args: [], expected: ['/api/forms/taken'], sample: [{ id: 1 }] },
  { name: 'listTakenByEmployee', http: 'get', args: [1], expected: ['/api/forms/taken/1'], sample: [{ id: 1 }] },
];

describe('formsService', () => {
  beforeEach(() => vi.clearAllMocks());

  specs.forEach(({ name, http, args, expected, sample }) => {
    it(`${name}() returns data on success`, async () => {
      api[http].mockResolvedValue({ data: sample });
      const result = await formsService[name](...args);
      expect(result).toEqual(sample);
      expect(api[http]).toHaveBeenCalledWith(...expected);
    });

    it(`${name}() propagates errors`, async () => {
      api[http].mockRejectedValue(new Error('boom'));
      await expect(formsService[name](...args)).rejects.toThrow('boom');
    });
  });
});
