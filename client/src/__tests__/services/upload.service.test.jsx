import { describe, it, expect, vi, beforeEach } from 'vitest';
import { uploadService } from '@/lib/services/upload.service.js';
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

describe('uploadService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('uploadCertificate sends multipart/form-data', async () => {
    api.post.mockResolvedValue({ data: { ok: true } });
    const fd = new FormData();
    const result = await uploadService.uploadCertificate(fd);
    expect(api.post).toHaveBeenCalledWith('/api/upload/certificate', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    expect(result).toEqual({ ok: true });
  });

  it('uploadCertificate propagates errors', async () => {
    api.post.mockRejectedValue(new Error('boom'));
    const fd = new FormData();
    await expect(uploadService.uploadCertificate(fd)).rejects.toThrow('boom');
  });

  it('uploadSignature sends multipart/form-data', async () => {
    api.post.mockResolvedValue({ data: { ok: true } });
    const fd = new FormData();
    await uploadService.uploadSignature(fd);
    expect(api.post).toHaveBeenCalledWith('/api/upload/signature', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  });

  it('uploadSignature propagates errors', async () => {
    api.post.mockRejectedValue(new Error('boom'));
    const fd = new FormData();
    await expect(uploadService.uploadSignature(fd)).rejects.toThrow('boom');
  });
});
