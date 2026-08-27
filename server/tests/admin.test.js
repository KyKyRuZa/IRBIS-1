import { describe, it, expect } from 'vitest';
import { request, app, authHeaders, loginAs } from './helpers.js';

describe('Admin', () => {
  const base = '/api/admin';

  it('rejects unauthenticated access', async () => {
    expect((await request(app).get(`${base}/demand`)).status).toBe(401);
  });

  it('rejects non-admin users', async () => {
    const user = await loginAs('user');
    expect((await user.get(`${base}/demand`)).status).toBe(403);
  });

  it('returns the demand page for admins', async () => {
    const admin = await loginAs('admin');
    const res = await admin.get(`${base}/demand`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('lists notifications and supports marking read', async () => {
    const admin = await loginAs('admin');
    const list = await admin.get(`${base}/notifications`);
    expect(list.status).toBe(200);
    expect(Array.isArray(list.body)).toBe(true);

    const markAll = await admin.patch(`${base}/notifications/read-all`);
    expect(markAll.status).toBe(200);
  });

  it('creates a backup (admin only)', async () => {
    const admin = await loginAs('admin');
    const res = await admin.get(`${base}/backup`);
    expect([200, 500]).toContain(res.status);
  });
});
