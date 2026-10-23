import { describe, it, expect, beforeEach } from 'vitest';
import { request, app, authHeaders, loginAs, resetDatabase, createSite, createItem, createEmployee } from './helpers.js';
import { prisma } from '../src/models/db.js';

const base = '/api/employees';
const issueBase = '/api/issues';

describe('Access control — P1.1', () => {
  beforeEach(resetDatabase);

  it('non-admin cannot list employees', async () => {
    const agent = await loginAs('user');
    const res = await agent.get(base);
    expect(res.status).toBe(403);
  });

  it('non-admin cannot access employee sizes by site', async () => {
    const site = await createSite();
    const agent = await loginAs('user');
    const res = await agent.get(`${base}/site/${site.id}/sizes`);
    expect(res.status).toBe(403);
  });

  it('non-admin can view own employee record', async () => {
    const site = await createSite();
    const emp = await createEmployee({ site_id: site.id });
    const user = await prisma.user.upsert({
      where: { username: 'tester' },
      update: { role: 'user' },
      create: { username: 'tester', passwordHash: '$2b$10$dummyhash', role: 'user' },
    });
    await prisma.employee.update({ where: { id: emp.id }, data: { userId: user.id } });

    const agent = await loginAs('user');
    const res = await agent.get(`${base}/${emp.id}`);
    expect(res.status).toBe(200);
    expect(res.body.full_name).toBe('Ivan Petrov');
  });

  it('non-admin cannot view another employee record', async () => {
    const site = await createSite();
    const emp1 = await createEmployee({ site_id: site.id });
    const emp2 = await createEmployee({ full_name: 'Other Employee', site_id: site.id });
    const user1 = await prisma.user.upsert({
      where: { username: 'tester' },
      update: { role: 'user' },
      create: { username: 'tester', passwordHash: '$2b$10$dummyhash', role: 'user' },
    });
    await prisma.employee.update({ where: { id: emp1.id }, data: { userId: user1.id } });

    const agent = await loginAs('user');
    const res = await agent.get(`${base}/${emp2.id}`);
    expect(res.status).toBe(403);
  });

  it('admin can view any employee record', async () => {
    const site = await createSite();
    const emp1 = await createEmployee({ site_id: site.id });
    const emp2 = await createEmployee({ full_name: 'Other Employee', site_id: site.id });
    const res = await request(app).get(`${base}/${emp2.id}`).set(authHeaders('admin', 1));
    expect(res.status).toBe(200);
    expect(res.body.full_name).toBe('Other Employee');
  });

  it('non-admin only sees own issue records in list', async () => {
    const site = await createSite();
    const item = await createItem();
    const emp1 = await createEmployee({ site_id: site.id });
    const emp2 = await createEmployee({ full_name: 'Other Employee', site_id: site.id });

    const user1 = await prisma.user.upsert({
      where: { username: 'tester' },
      update: { role: 'user' },
      create: { username: 'tester', passwordHash: '$2b$10$dummyhash', role: 'user' },
    });
    await prisma.employee.update({ where: { id: emp1.id }, data: { userId: user1.id } });

    await request(app)
      .post(issueBase)
      .set(authHeaders('admin', 1))
      .send({ employee_id: emp1.id, item_type_id: item.id, quantity: 1 });
    await request(app)
      .post(issueBase)
      .set(authHeaders('admin', 1))
      .send({ employee_id: emp2.id, item_type_id: item.id, quantity: 1 });

    const agent = await loginAs('user');
    const res = await agent.get(issueBase);
    expect(res.status).toBe(200);
    const ids = res.body.data.map((r) => r.employee_id);
    expect(ids).toContain(emp1.id);
    expect(ids).not.toContain(emp2.id);
  });

  it('non-admin cannot view another employee issue record', async () => {
    const site = await createSite();
    const item = await createItem();
    const emp1 = await createEmployee({ site_id: site.id });
    const emp2 = await createEmployee({ full_name: 'Other Employee', site_id: site.id });

    const issueRes = await request(app)
      .post(issueBase)
      .set(authHeaders('admin', 1))
      .send({ employee_id: emp2.id, item_type_id: item.id, quantity: 1 });

    const user1 = await prisma.user.upsert({
      where: { username: 'tester' },
      update: { role: 'user' },
      create: { username: 'tester', passwordHash: '$2b$10$dummyhash', role: 'user' },
    });
    await prisma.employee.update({ where: { id: emp1.id }, data: { userId: user1.id } });

    const agent = await loginAs('user');
    const res = await agent.get(`${issueBase}/${issueRes.body.id}`);
    expect(res.status).toBe(403);
  });

  it('non-admin can view own issue record', async () => {
    const site = await createSite();
    const item = await createItem();
    const emp1 = await createEmployee({ site_id: site.id });

    const issueRes = await request(app)
      .post(issueBase)
      .set(authHeaders('admin', 1))
      .send({ employee_id: emp1.id, item_type_id: item.id, quantity: 1 });

    const user1 = await prisma.user.upsert({
      where: { username: 'tester' },
      update: { role: 'user' },
      create: { username: 'tester', passwordHash: '$2b$10$dummyhash', role: 'user' },
    });
    await prisma.employee.update({ where: { id: emp1.id }, data: { userId: user1.id } });

    const agent = await loginAs('user');
    const res = await agent.get(`${issueBase}/${issueRes.body.id}`);
    expect(res.status).toBe(200);
  });

  it('non-admin cannot access expiring endpoint', async () => {
    const agent = await loginAs('user');
    const res = await agent.get(`${issueBase}/expiring`);
    expect(res.status).toBe(403);
  });
});
