import { describe, it, expect, vi, beforeEach } from 'vitest';
import { employeesService } from '@/lib/services/employees.service.js';
import { EMPLOYEE_STATUSES } from '@/lib/constants/employee-statuses.js';
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
  { name: 'list', http: 'get', args: [{ status: 'active' }], expected: ['/api/employees', { params: { status: 'active' } }], sample: [{ id: 1 }] },
  { name: 'get', http: 'get', args: [7], expected: ['/api/employees/7'], sample: { id: 7 } },
  { name: 'create', http: 'post', args: [{ full_name: 'x' }], expected: ['/api/employees', { full_name: 'x' }], sample: { id: 1 } },
  { name: 'update', http: 'put', args: [7, { full_name: 'y' }], expected: ['/api/employees/7', { full_name: 'y' }], sample: { id: 7 } },
  { name: 'terminate', http: 'patch', args: [7], expected: ['/api/employees/7/terminate'], sample: { id: 7 } },
  { name: 'delete', http: 'delete', args: [7], expected: ['/api/employees/7'], sample: { id: 7 } },
  { name: 'search', http: 'get', args: ['иван'], expected: ['/api/employees', { params: { search: 'иван' } }], sample: [{ id: 1 }] },
  { name: 'bySite', http: 'get', args: [3], expected: ['/api/employees', { params: { site_id: 3, status: EMPLOYEE_STATUSES.active } }], sample: [{ id: 1 }] },
];

describe('employeesService', () => {
  beforeEach(() => vi.clearAllMocks());

  specs.forEach(({ name, http, args, expected, sample }) => {
    it(`${name}() returns data on success`, async () => {
      api[http].mockResolvedValue({ data: sample });
      const result = await employeesService[name](...args);
      expect(result).toEqual(sample);
      expect(api[http]).toHaveBeenCalledWith(...expected);
    });

    it(`${name}() propagates errors`, async () => {
      api[http].mockRejectedValue(new Error('boom'));
      await expect(employeesService[name](...args)).rejects.toThrow('boom');
    });
  });

  it('bySite passes an explicit status when provided', async () => {
    api.get.mockResolvedValue({ data: [] });
    await employeesService.bySite(3, EMPLOYEE_STATUSES.terminated);
    expect(api.get).toHaveBeenCalledWith('/api/employees', { params: { site_id: 3, status: EMPLOYEE_STATUSES.terminated } });
  });
});
