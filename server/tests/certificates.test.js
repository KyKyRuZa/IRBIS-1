import { describe, it, expect } from 'vitest';
import {
  request,
  app,
  authHeaders,
  createSite,
  createItem,
  createEmployee,
  createCertificate,
} from './helpers.js';

describe('Certificates', () => {
  const base = '/api/certificates';

  it('requires authentication', async () => {
    expect((await request(app).get(base)).status).toBe(401);
  });

  it('rejects an empty payload', async () => {
    expect(
      (await request(app).post(base).set(authHeaders('admin', 1)).send({})).status
    ).toBe(400);
  });

  it('creates, reads, updates and deletes a certificate', async () => {
    const item = await createItem();
    const create = await request(app)
      .post(base)
      .set(authHeaders('admin', 1))
      .send({
        item_type_id: item.id,
        product_name: 'Cert Product',
        certificate_number: 'CERT-1',
        issue_date: '2024-01-01',
        expiry_date: '2030-01-01',
      });
    expect(create.status).toBe(201);
    const id = create.body.id;

    const one = await request(app).get(`${base}/${id}`).set(authHeaders('admin', 1));
    expect(one.status).toBe(200);
    expect(one.body.certificate_number).toBe('CERT-1');

    const upd = await request(app)
      .put(`${base}/${id}`)
      .set(authHeaders('admin', 1))
      .send({ certificate_number: 'CERT-2' });
    expect(upd.status).toBe(200);
    expect(upd.body.certificate_number).toBe('CERT-2');

    const del = await request(app).delete(`${base}/${id}`).set(authHeaders('admin', 1));
    expect(del.status).toBe(200);
  });

  it('lists certificates by item type', async () => {
    const item = await createItem();
    await createCertificate({ item_type_id: item.id });
    const res = await request(app)
      .get(`${base}/item/${item.id}`)
      .set(authHeaders('admin', 1));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('lists all certificates', async () => {
    const item = await createItem();
    await createCertificate({ item_type_id: item.id });
    const res = await request(app).get(base).set(authHeaders('admin', 1));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
