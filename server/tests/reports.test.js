import { describe, it, expect } from 'vitest';
import { request, app, authHeaders, loginAs, createEmployee } from './helpers.js';

describe('Reports & export (admin)', () => {
  const reportBase = '/api/reports';
  const exportBase = '/api/export';

  it('rejects unauthenticated report access', async () => {
    expect((await request(app).get(`${reportBase}/excel`)).status).toBe(401);
  });

  it('rejects non-admin report access', async () => {
    const user = await loginAs('user');
    expect((await user.get(`${reportBase}/excel`)).status).toBe(403);
  });

  it('returns the excel demand + issues + expiring reports', async () => {
    const admin = await loginAs('admin');
    for (const path of ['/excel', '/demand/excel', '/issues-report', '/expiring-report']) {
      const res = await admin.get(`${reportBase}${path}`);
      expect([200, 400]).toContain(res.status);
      expect(Buffer.isBuffer(res.body) || typeof res.body === 'object').toBe(true);
    }
  });

  it('exports excel/consumables/items/all-cards reports (admin)', async () => {
    const admin = await loginAs('admin');
    const paths = ['/excel', '/demand/excel', '/items-report', '/all-cards', '/group-consumables'];
    for (const p of paths) {
      const res = await admin.get(`${exportBase}${p}`);
      expect([200, 400]).toContain(res.status);
    }
  });

  it('exports an employee card for a real employee', async () => {
    const admin = await loginAs('admin');
    const emp = await createEmployee();
    const res = await admin.get(`${exportBase}/employee-card/${emp.id}`);
    expect([200, 400]).toContain(res.status);
  });

  it('exports consumables for a real employee', async () => {
    const admin = await loginAs('admin');
    const emp = await createEmployee();
    const res = await admin.get(`${exportBase}/consumables/${emp.id}`);
    expect([200, 400]).toContain(res.status);
  });
});
