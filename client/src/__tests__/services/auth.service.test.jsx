import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService } from '@/lib/services/auth.service.js';
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
  { name: 'login', http: 'post', args: ['user', 'pass'], expected: ['/api/auth/login', { username: 'user', password: 'pass' }], sample: { token: 't', username: 'user', role: 'admin' } },
  { name: 'register', http: 'post', args: ['user', 'pass'], expected: ['/api/auth/register', { username: 'user', password: 'pass', role: 'admin' }], sample: { id: 1 } },
  { name: 'changePassword', http: 'post', args: ['old', 'new'], expected: ['/api/auth/change-password', { oldPassword: 'old', newPassword: 'new' }], sample: { ok: true } },
];

describe('authService', () => {
  beforeEach(() => vi.clearAllMocks());

  specs.forEach(({ name, http, args, expected, sample }) => {
    it(`${name}() returns data on success`, async () => {
      api[http].mockResolvedValue({ data: sample });
      const result = await authService[name](...args);
      expect(result).toEqual(sample);
      expect(api[http]).toHaveBeenCalledWith(...expected);
    });

    it(`${name}() propagates errors`, async () => {
      api[http].mockRejectedValue(new Error('boom'));
      await expect(authService[name](...args)).rejects.toThrow('boom');
    });
  });

  it('register sends the provided role', async () => {
    api.post.mockResolvedValue({ data: { id: 2 } });
    await authService.register('u', 'p', 'user');
    expect(api.post).toHaveBeenCalledWith('/api/auth/register', { username: 'u', password: 'p', role: 'user' });
  });
});
