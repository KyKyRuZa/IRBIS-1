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
