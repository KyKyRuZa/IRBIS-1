import { describe, it, expect } from 'vitest';
import {
  request,
  app,
  authHeaders,
  createSite,
  createItem,
  createEmployee,
  makeToken,
} from './helpers.js';

describe('Issues (issue records)', () => {
  const base = '/api/issues';

  let seed;
  async function seedIssue() {
    const site = await createSite();
    const item = await createItem();
    const emp = await createEmployee();
    const create = await request(app)
      .post(base)
      .set(authHeaders('admin', 1))
      .send({
        employee_id: emp.id,
        item_type_id: item.id,
        site_id: site.id,
        quantity: 2,
        issued_by: 1,
      });
    return {
      id: create.body.id,
      employee_id: emp.id,
      item_type_id: item.id,
      site_id: site.id,
    };
  }

  it('requires authentication', async () => {
    expect((await request(app).get(base)).status).toBe(401);
  });

  it('rejects an empty payload', async () => {
    expect(
      (await request(app).post(base).set(authHeaders('admin', 1)).send({})).status
    ).toBe(400);
  });

  it('creates a single issue (note: response nests under `issue`)', async () => {
    const site = await createSite();
    const item = await createItem();
    const emp = await createEmployee();
    const res = await request(app)
      .post(base)
      .set(authHeaders('admin', 1))
      .send({
        employee_id: emp.id,
        item_type_id: item.id,
        site_id: site.id,
        quantity: 2,
        issued_by: 1,
      });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
  });

  it('creates a batch of issues', async () => {
    const site = await createSite();
    const item = await createItem();
    await createEmployee({ site_id: site.id });
    const res = await request(app)
      .post(`${base}/batch`)
      .set(authHeaders('admin', 1))
      .send({
        site_id: site.id,
        item_type_id: item.id,
        quantity: 1,
      });
    expect(res.status).toBe(201);
    expect(Array.isArray(res.body.records)).toBe(true);
  });

  it('reads, updates, disposes and returns an issue', async () => {
    const s = await seedIssue();
    const one = await request(app).get(`${base}/${s.id}`).set(authHeaders('admin', 1));
    expect(one.status).toBe(200);

    const upd = await request(app)
      .put(`${base}/${s.id}`)
      .set(authHeaders('admin', 1))
      .send({ quantity: 3 });
    expect(upd.status).toBe(200);

    const dispose = await request(app)
      .patch(`${base}/${s.id}/dispose`)
      .set(authHeaders('admin', 1));
    expect(dispose.status).toBe(200);

    const ret = await request(app)
      .patch(`${base}/${s.id}/return`)
      .set(authHeaders('admin', 1));
    expect(ret.status).toBe(200);
  });

  it('lists expiring issues with a `days` filter', async () => {
    await seedIssue();
    const res = await request(app)
      .get(`${base}/expiring?days=30`)
      .set(authHeaders('admin', 1));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('lists all issues', async () => {
    await seedIssue();
    const res = await request(app).get(base).set(authHeaders('admin', 1));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
