import { describe, it, expect } from 'vitest';
import {
  request,
  app,
  authHeaders,
  loginAs,
  createEmployee,
  createForm,
} from './helpers.js';

describe('Forms', () => {
  const base = '/api/forms';

  it('requires authentication', async () => {
    expect((await request(app).get(base)).status).toBe(401);
  });

  it('creates and lists forms (admin)', async () => {
    const create = await request(app)
      .post(base)
      .set(authHeaders('admin', 1))
      .send({
        name: 'Safety Form',
        description: 'Monthly safety acknowledgement',
      });
    expect(create.status).toBe(201);

    const list = await request(app).get(base).set(authHeaders('admin', 1));
    expect(list.status).toBe(200);
    expect(Array.isArray(list.body)).toBe(true);
  });

  it('gets, updates, and deletes a form (admin)', async () => {
    const form = await createForm({ name: 'Original', description: 'desc' });

    const getRes = await request(app)
      .get(`${base}/${form.id}`)
      .set(authHeaders('admin', 1));
    expect(getRes.status).toBe(200);
    expect(getRes.body.name).toBe('Original');

    const updateRes = await request(app)
      .put(`${base}/${form.id}`)
      .set(authHeaders('admin', 1))
      .send({ name: 'Updated', description: 'new desc' });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.name).toBe('Updated');

    const deleteRes = await request(app)
      .delete(`${base}/${form.id}`)
      .set(authHeaders('admin', 1));
    expect(deleteRes.status).toBe(200);

    const getAfterDelete = await request(app)
      .get(`${base}/${form.id}`)
      .set(authHeaders('admin', 1));
    expect(getAfterDelete.status).toBe(404);
  });

  it('takes a form for the requesting employee', async () => {
    const emp = await createEmployee();
    const form = await createForm({ employee_id: emp.id });
    const agent = await loginAs('user');
    const take = await agent
      .post(`${base}/take`)
      .send({ form_id: form.id, employee_id: emp.id });
    expect(take.status).toBe(201);

    const taken = await request(app)
      .get(`${base}/taken`)
      .set(authHeaders('admin', 1));
    expect(taken.status).toBe(200);
    expect(Array.isArray(taken.body)).toBe(true);
  });
});
