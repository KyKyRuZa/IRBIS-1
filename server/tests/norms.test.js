import { describe, it, expect } from 'vitest';
import {
  request,
  app,
  authHeaders,
  createSite,
  createItem,
  createEmployee,
} from './helpers.js';

describe('Norms (issue norms)', () => {
  const base = '/api/norms';

  it('requires authentication', async () => {
    expect((await request(app).get(base)).status).toBe(401);
  });

  it('rejects an empty payload', async () => {
    expect(
      (await request(app).post(base).set(authHeaders('admin', 1)).send({})).status
    ).toBe(400);
  });

  it('creates, reads, updates and deletes a norm', async () => {
    const site = await createSite();
    const item = await createItem();
    const emp = await createEmployee();
    const create = await request(app)
      .post(base)
      .set(authHeaders('admin', 1))
      .send({
        site_id: site.id,
        employee_id: emp.id,
        item_type_id: item.id,
        period_months: 6,
        quantity: 5,
      });
    expect(create.status).toBe(201);
    const id = create.body.id;

    const one = await request(app).get(`${base}/${id}`).set(authHeaders('admin', 1));
    expect(one.status).toBe(200);
    expect(one.body.quantity).toBe(5);

    const upd = await request(app)
      .put(`${base}/${id}`)
      .set(authHeaders('admin', 1))
      .send({ quantity: 10 });
    expect(upd.status).toBe(200);
    expect(upd.body.quantity).toBe(10);

    const del = await request(app).delete(`${base}/${id}`).set(authHeaders('admin', 1));
    expect(del.status).toBe(200);
  });

  it('lists norms by employee', async () => {
    const site = await createSite();
    const item = await createItem();
    const emp = await createEmployee();
    await request(app)
      .post(base)
      .set(authHeaders('admin', 1))
      .send({
        site_id: site.id,
        employee_id: emp.id,
        item_type_id: item.id,
        quantity: 3,
      });
    const res = await request(app)
      .get(`${base}/employee/${emp.id}`)
      .set(authHeaders('admin', 1));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
