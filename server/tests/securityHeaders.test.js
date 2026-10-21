import { describe, it, expect } from 'vitest';
import { request, app, authHeaders, loginAs } from './helpers.js';

describe('Security headers', () => {
  it('does not expose x-powered-by (nginx handles security headers in production)', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('does not set X-Content-Type-Options (handled by nginx add_header)', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['x-content-type-options']).toBeUndefined();
  });

  it('does not set X-Frame-Options (handled by nginx add_header)', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['x-frame-options']).toBeUndefined();
  });

  it('does not set Content-Security-Policy (handled by nginx add_header)', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['content-security-policy']).toBeUndefined();
  });

  it('does not set Strict-Transport-Security (handled by nginx add_header)', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['strict-transport-security']).toBeUndefined();
  });

  it('does not set Referrer-Policy (handled by nginx add_header)', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['referrer-policy']).toBeUndefined();
  });
});
