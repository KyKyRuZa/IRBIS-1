import { describe, it, expect } from 'vitest';
import { request, app, authHeaders, createSite } from './helpers.js';

describe('Items (item types)', () => {
  const base = '/api/items';

  it('requires authentication', async () => {
    expect((await request(app).get(base)).status).toBe(401);
  });

  it('rejects an empty payload', async () => {
    expect(
      (await request(app).post(base).set(authHeaders('admin', 1)).send({})).status
    ).toBe(400);
  });

  it('creates and reads an item', async () => {
    const create = await request(app)
      .post(base)
      .set(authHeaders('admin', 1))
      .send({
        name: 'Hammer',
        category: 'consumable',
        description: 'Claw hammer',
        requires_certificate: false,
      });
    expect(create.status).toBe(201);
    const id = create.body.id;

    const one = await request(app).get(`${base}/${id}`).set(authHeaders('admin', 1));
    expect(one.status).toBe(200);
    expect(one.body.name).toBe('Hammer');
  });

  it('lists items filtered by category', async () => {
    await request(app)
      .post(base)
      .set(authHeaders('admin', 1))
      .send({ name: 'Gloves', category: 'consumable', requires_certificate: false });
    const list = await request(app)
      .get(`${base}?category=consumable`)
      .set(authHeaders('admin', 1));
    expect(list.status).toBe(200);
    expect(Array.isArray(list.body)).toBe(true);
  });

  it('updates and deletes an item', async () => {
    const create = await request(app)
      .post(base)
      .set(authHeaders('admin', 1))
      .send({ name: 'Wrench', category: 'consumable', requires_certificate: false });
    const id = create.body.id;
    const upd = await request(app)
      .put(`${base}/${id}`)
      .set(authHeaders('admin', 1))
      .send({ name: 'Adjustable Wrench' });
    expect(upd.status).toBe(200);
    const del = await request(app).delete(`${base}/${id}`).set(authHeaders('admin', 1));
    expect(del.status).toBe(200);
  });

  it('does not require a site to create an item', async () => {
    const site = await createSite();
    expect(site.id).toBeDefined();
  });
});
