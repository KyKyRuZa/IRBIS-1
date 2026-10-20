import { describe, it, expect } from 'vitest';
import { request, app, authHeaders, loginAs } from './helpers.js';

describe('Security headers', () => {
  it('sets X-Content-Type-Options: nosniff on all responses', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  it('sets X-Frame-Options: DENY on all responses', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['x-frame-options']).toBe('DENY');
  });

  it('sets Referrer-Policy: no-referrer', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['referrer-policy']).toBe('no-referrer');
  });

  it('sets Strict-Transport-Security with max-age and includeSubDomains', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['strict-transport-security']).toContain('max-age=31536000');
    expect(res.headers['strict-transport-security']).toContain('includeSubDomains');
    expect(res.headers['strict-transport-security']).toContain('preload');
  });

  it('sets Content-Security-Policy with default-src self', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['content-security-policy']).toContain("default-src 'self'");
    expect(res.headers['content-security-policy']).toContain("frame-ancestors 'none'");
    expect(res.headers['content-security-policy']).toContain("script-src 'self'");
  });

  it('sets security headers even on error responses (401)', async () => {
    const res = await request(app).get('/api/employees');
    expect(res.status).toBe(401);
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBe('DENY');
  });

  it('sets security headers even on 404 responses', async () => {
    const res = await request(app).get('/api/nonexistent-route');
    expect(res.status).toBe(404);
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBe('DENY');
  });

  it('sets security headers on authenticated routes', async () => {
    const admin = await loginAs('admin');
    const res = await admin.get('/api/admin/demand');
    expect(res.status).toBe(200);
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['strict-transport-security']).toBeDefined();
    expect(res.headers['content-security-policy']).toBeDefined();
  });
});
