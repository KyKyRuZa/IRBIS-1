import { describe, it, expect } from 'vitest';
import { request, app, authHeaders } from './helpers.js';

describe('Sites', () => {
  const base = '/api/sites';

  it('requires authentication', async () => {
    expect((await request(app).get(base)).status).toBe(401);
  });

  it('rejects an empty payload', async () => {
    expect(
      (await request(app).post(base).set(authHeaders('admin', 1)).send({})).status
    ).toBe(400);
  });

  it('creates, reads, updates and deletes a site', async () => {
    const create = await request(app)
      .post(base)
      .set(authHeaders('admin', 1))
      .send({ name: 'Site A', location: 'Moscow' });
    expect(create.status).toBe(201);
    const id = create.body.id;

    const list = await request(app).get(base).set(authHeaders('admin', 1));
    expect(list.status).toBe(200);
    expect(Array.isArray(list.body)).toBe(true);

    const one = await request(app).get(`${base}/${id}`).set(authHeaders('admin', 1));
    expect(one.status).toBe(200);
    expect(one.body.id).toBe(id);

    const upd = await request(app)
      .put(`${base}/${id}`)
      .set(authHeaders('admin', 1))
      .send({ name: 'Site A2' });
    expect(upd.status).toBe(200);
    expect(upd.body.name).toBe('Site A2');

    const del = await request(app)
      .delete(`${base}/${id}`)
      .set(authHeaders('admin', 1));
    expect(del.status).toBe(200);
  });

  it('returns 404 for an unknown id', async () => {
    const res = await request(app).get(`${base}/999999`).set(authHeaders('admin', 1));
    expect(res.status).toBe(404);
  });
});
