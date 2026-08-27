import { describe, it, expect } from 'vitest';
import { request, app, authHeaders, createSite } from './helpers.js';

describe('Employees', () => {
  const base = '/api/employees';

  it('requires authentication', async () => {
    expect((await request(app).get(base)).status).toBe(401);
  });

  it('rejects an empty payload', async () => {
    expect(
      (await request(app).post(base).set(authHeaders('admin', 1)).send({})).status
    ).toBe(400);
  });

  it('creates, reads, updates, terminates and deletes an employee', async () => {
    const create = await request(app)
      .post(base)
      .set(authHeaders('admin', 1))
      .send({
        full_name: 'Ivan Petrov',
        position: 'Engineer',
        department: 'Ops',
        contact: 'ivan@example.com',
      });
    expect(create.status).toBe(201);
    const id = create.body.id;

    const one = await request(app).get(`${base}/${id}`).set(authHeaders('admin', 1));
    expect(one.status).toBe(200);
    expect(one.body.full_name).toBe('Ivan Petrov');

    const upd = await request(app)
      .put(`${base}/${id}`)
      .set(authHeaders('admin', 1))
      .send({ position: 'Senior Engineer' });
    expect(upd.status).toBe(200);
    expect(upd.body.position).toBe('Senior Engineer');

    const term = await request(app)
      .patch(`${base}/${id}/terminate`)
      .set(authHeaders('admin', 1));
    expect(term.status).toBe(200);
    expect(term.body.status).toBe('terminated');

    const del = await request(app)
      .delete(`${base}/${id}`)
      .set(authHeaders('admin', 1));
    expect(del.status).toBe(200);
  });

  it('lists employees filtered by site', async () => {
    const site = await createSite();
    await request(app)
      .post(base)
      .set(authHeaders('admin', 1))
      .send({ full_name: 'A B', position: 'Worker', site_id: site.id });
    const list = await request(app).get(`${base}?site_id=${site.id}`).set(authHeaders('admin', 1));
    expect(list.status).toBe(200);
    expect(Array.isArray(list.body)).toBe(true);
  });
});
