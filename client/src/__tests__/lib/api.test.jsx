import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api, downloadBlob } from '@/lib/api.js';

describe('api client', () => {
  beforeEach(() => {
    localStorage.clear();
    api.defaults.adapter = () =>
      Promise.resolve({ data: {}, status: 200, statusText: 'OK', headers: {}, config: {} });
  });

  it('attaches a Bearer token from localStorage to outgoing requests', async () => {
    localStorage.setItem('token', 'xyz');
    let headers;
    api.interceptors.request.use((c) => {
      headers = c.headers;
      return c;
    });
    await api.get('/whatever');
    expect(headers.Authorization).toBe('Bearer xyz');
  });

  it('does not attach Authorization when no token is stored', async () => {
    localStorage.removeItem('token');
    let headers;
    api.interceptors.request.use((c) => {
      headers = c.headers;
      return c;
    });
    await api.get('/whatever');
    expect(headers.Authorization).toBeUndefined();
  });

  it('does not double-prefix an existing Bearer token', async () => {
    localStorage.setItem('token', 'Bearer existing');
    let headers;
    api.interceptors.request.use((c) => {
      headers = c.headers;
      return c;
    });
    await api.get('/whatever');
    expect(headers.Authorization).toBe('Bearer existing');
  });

  it('downloadBlob requests with responseType blob', async () => {
    const spy = vi.spyOn(api, 'get').mockResolvedValue({ data: 'blob' });
    const res = await downloadBlob('/file', { a: 1 });
    expect(spy).toHaveBeenCalledWith('/file', { params: { a: 1 }, responseType: 'blob' });
    expect(res.data).toBe('blob');
    spy.mockRestore();
  });
});
