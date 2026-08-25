import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api, downloadBlob } from '@/lib/api.js';

describe('api client', () => {
  beforeEach(() => {
    localStorage.clear();
    api.defaults.adapter = () =>
      Promise.resolve({ data: {}, status: 200, statusText: 'OK', headers: {}, config: {} });
  });

  it('sends credentials (cookies) with requests instead of a localStorage token', async () => {
    let withCredentials;
    api.interceptors.request.use((c) => {
      withCredentials = c.withCredentials;
      return c;
    });
    await api.get('/whatever');
    expect(withCredentials).toBe(true);
  });

  it('does not attach an Authorization header from localStorage', async () => {
    localStorage.setItem('token', 'xyz');
    let headers;
    api.interceptors.request.use((c) => {
      headers = c.headers;
      return c;
    });
    await api.get('/whatever');
    expect(headers.Authorization).toBeUndefined();
  });

  it('downloadBlob requests with responseType blob', async () => {
    const spy = vi.spyOn(api, 'get').mockResolvedValue({ data: 'blob' });
    const res = await downloadBlob('/file', { a: 1 });
    expect(spy).toHaveBeenCalledWith('/file', { params: { a: 1 }, responseType: 'blob' });
    expect(res.data).toBe('blob');
    spy.mockRestore();
  });
});
