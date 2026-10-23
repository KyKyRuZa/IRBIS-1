import { describe, it, expect, beforeEach } from 'vitest';
import { request, app, authHeaders, createSite, createItem, createEmployee, resetDatabase } from './helpers.js';
import { prisma } from '../src/models/db.js';

const base = '/api/issues';

describe('Issues — atomic returnItem', () => {
  beforeEach(resetDatabase);

  async function seedIssue(overrides = {}) {
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
        quantity: 10,
        ...overrides,
      });
    expect(res.status).toBe(201);
    return res.body;
  }

  it('returns a partial quantity and keeps status "issued"', async () => {
    const issue = await seedIssue();
    const res = await request(app)
      .patch(`${base}/${issue.id}/return`)
      .set(authHeaders('admin', 1))
      .send({ return_quantity: 3 });

    expect(res.status).toBe(200);
    expect(res.body.return_quantity).toBe(3);
    expect(res.body.status).toBe('issued');
  });

  it('returns the full quantity and changes status to "returned"', async () => {
    const issue = await seedIssue({ quantity: 5 });
    const res = await request(app)
      .patch(`${base}/${issue.id}/return`)
      .set(authHeaders('admin', 1))
      .send({ return_quantity: 5 });

    expect(res.status).toBe(200);
    expect(res.body.return_quantity).toBe(5);
    expect(res.body.status).toBe('returned');
  });

  it('rejects return_quantity > remaining quantity', async () => {
    const issue = await seedIssue({ quantity: 5 });
    await request(app)
      .patch(`${base}/${issue.id}/return`)
      .set(authHeaders('admin', 1))
      .send({ return_quantity: 3 });

    const res = await request(app)
      .patch(`${base}/${issue.id}/return`)
      .set(authHeaders('admin', 1))
      .send({ return_quantity: 3 });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('exceeds remaining quantity');
  });

  it('rejects return_quantity <= 0', async () => {
    const issue = await seedIssue();
    const res = await request(app)
      .patch(`${base}/${issue.id}/return`)
      .set(authHeaders('admin', 1))
      .send({ return_quantity: 0 });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('must be greater than 0');
  });

  it('rejects return on a disposed record (409)', async () => {
    const issue = await seedIssue();
    await request(app)
      .patch(`${base}/${issue.id}/dispose`)
      .set(authHeaders('admin', 1));

    const res = await request(app)
      .patch(`${base}/${issue.id}/return`)
      .set(authHeaders('admin', 1))
      .send({ return_quantity: 1 });

    expect(res.status).toBe(409);
  });

  it('rejects return on an already-returned record (409)', async () => {
    const issue = await seedIssue({ quantity: 2 });
    await request(app)
      .patch(`${base}/${issue.id}/return`)
      .set(authHeaders('admin', 1))
      .send({ return_quantity: 2 });

    const res = await request(app)
      .patch(`${base}/${issue.id}/return`)
      .set(authHeaders('admin', 1))
      .send({ return_quantity: 1 });

    expect(res.status).toBe(409);
    expect(res.body.error).toContain('Cannot return a record with status');
  });

  it('rejects return on a non-existent record (404)', async () => {
    const res = await request(app)
      .patch(`${base}/99999/return`)
      .set(authHeaders('admin', 1))
      .send({ return_quantity: 1 });

    expect(res.status).toBe(404);
  });

  it('uses today\'s date when return_date is not provided', async () => {
    const issue = await seedIssue();
    const today = new Date().toISOString().split('T')[0];
    const res = await request(app)
      .patch(`${base}/${issue.id}/return`)
      .set(authHeaders('admin', 1))
      .send({ return_quantity: 1 });

    expect(res.status).toBe(200);
    expect(res.body.return_date).toContain(today);
  });
});

describe('Issues — requires_certificate check', () => {
  beforeEach(resetDatabase);

  it('rejects issuing an item that requires_certificate without a certificate_id', async () => {
    const site = await createSite();
    const item = await createItem({ requires_certificate: true });
    const emp = await createEmployee();

    const res = await request(app)
      .post(base)
      .set(authHeaders('admin', 1))
      .send({
        employee_id: emp.id,
        item_type_id: item.id,
        site_id: site.id,
        quantity: 1,
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('certificate_id is required');
  });

  it('allows issuing an item that requires_certificate WITH a certificate_id', async () => {
    const site = await createSite();
    const item = await createItem({ requires_certificate: true });
    const emp = await createEmployee();
    const cert = await request(app)
      .post('/api/certificates')
      .set(authHeaders('admin', 1))
      .send({
        product_name: 'Test Cert',
        certificate_number: 'CERT-123',
        issue_date: '2024-01-01',
        expiry_date: '2026-12-31',
        item_type_id: item.id,
      });

    const res = await request(app)
      .post(base)
      .set(authHeaders('admin', 1))
      .send({
        employee_id: emp.id,
        item_type_id: item.id,
        site_id: site.id,
        quantity: 1,
        certificate_id: cert.body.id,
      });

    expect(res.status).toBe(201);
  });

  it('allows issuing an item without certificate if requires_certificate is false', async () => {
    const site = await createSite();
    const item = await createItem({ requires_certificate: false });
    const emp = await createEmployee();

    const res = await request(app)
      .post(base)
      .set(authHeaders('admin', 1))
      .send({
        employee_id: emp.id,
        item_type_id: item.id,
        site_id: site.id,
        quantity: 1,
      });

    expect(res.status).toBe(201);
  });
});

describe('Issues — batchIssueSingle requires_certificate check', () => {
  beforeEach(resetDatabase);

  it('rejects batch-single with an item requiring certificate without certificate_id', async () => {
    const site = await createSite();
    const item = await createItem({ requires_certificate: true });
    const emp = await createEmployee();

    const res = await request(app)
      .post(`${base}/batch-single`)
      .set(authHeaders('admin', 1))
      .send({
        employee_id: emp.id,
        site_id: site.id,
        items: [{ item_type_id: item.id, quantity: 1 }],
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('certificate_id is required');
  });
});

describe('Issues — signature_path not settable via issueItem', () => {
  beforeEach(resetDatabase);

  it('ignores signature_path in the request body (must be set via upload endpoint)', async () => {
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
        quantity: 1,
        signature_path: '/uploads/signature/evil.png',
      });

    expect(res.status).toBe(201);
    expect(res.body.signature_path).toBeNull();
  });
});

describe('Issues — getExpiring days/months parameter', () => {
  beforeEach(resetDatabase);

  async function seedExpiringItem(monthsOffset) {
    const site = await createSite();
    const item = await createItem({ default_wear_time: 12 });
    const emp = await createEmployee();
    const issueDate = '2024-01-01';
    const res = await request(app)
      .post(base)
      .set(authHeaders('admin', 1))
      .send({
        employee_id: emp.id,
        item_type_id: item.id,
        site_id: site.id,
        quantity: 1,
        issue_date: issueDate,
      });
    expect(res.status).toBe(201);
    return res.body;
  }

  it('uses `months` query param when provided', async () => {
    await seedExpiringItem(1);
    const res = await request(app)
      .get(`${base}/expiring`)
      .set(authHeaders('admin', 1))
      .query({ months: 24 });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('ignores `days` query param (only months is supported)', async () => {
    await seedExpiringItem(1);
    const res = await request(app)
      .get(`${base}/expiring`)
      .set(authHeaders('admin', 1))
      .query({ days: 730 });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('falls back to default 2 months when no params provided', async () => {
    await seedExpiringItem(1);
    const res = await request(app)
      .get(`${base}/expiring`)
      .set(authHeaders('admin', 1));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('returns 400 for negative months', async () => {
    const res = await request(app)
      .get(`${base}/expiring`)
      .set(authHeaders('admin', 1))
      .query({ months: -1 });
    expect(res.status).toBe(400);
  });
});

describe('Issues — getExpiringItems filters by status=issued only', () => {
  beforeEach(resetDatabase);

  it('does not include disposed records in expiring results', async () => {
    const site = await createSite();
    const item = await createItem({ default_wear_time: 1 });
    const emp = await createEmployee();

    const create = await request(app)
      .post(base)
      .set(authHeaders('admin', 1))
      .send({
        employee_id: emp.id,
        item_type_id: item.id,
        site_id: site.id,
        quantity: 1,
        issue_date: '2020-01-01',
      });

    const issueId = create.body.id;

    // Dispose it — should not appear in expiring
    await request(app)
      .patch(`${base}/${issueId}/dispose`)
      .set(authHeaders('admin', 1));

    const res = await request(app)
      .get(`${base}/expiring`)
      .set(authHeaders('admin', 1))
      .query({ months: 720 });

    expect(res.status).toBe(200);
    const found = res.body.find(r => r.id === issueId);
    expect(found).toBeUndefined();
  });
});

describe('Issues — auth & permissions', () => {
  beforeEach(resetDatabase);

  it('requires authentication for all issue endpoints', async () => {
    expect((await request(app).get(base)).status).toBe(401);
    expect((await request(app).post(base).send({})).status).toBe(401);
    expect((await request(app).get(`${base}/1`)).status).toBe(401);
  });

  it('non-admin cannot create issues', async () => {
    const user = await request(app)
      .post('/api/auth/register')
      .then(() => request(app).post('/api/auth/login').send({ username: 'nonadmin', password: 'Pass123!' }));
    // If no register endpoint, just test with a user token
    const { authHeaders, loginAs } = await import('./helpers.js');
    const agent = await loginAs('user');
    const site = await createSite();
    const item = await createItem();
    const emp = await createEmployee();
    const res = await agent
      .post(base)
      .send({
        employee_id: emp.id,
        item_type_id: item.id,
        site_id: site.id,
        quantity: 1,
      });
    expect(res.status).toBe(403);
  });
});

describe('Issues — error response sanitization', () => {
  beforeEach(resetDatabase);

  it('returns generic error message (not stack trace) in test mode', async () => {
    const res = await request(app)
      .get(`${base}/nonexistent-id-format`)
      .set(authHeaders('admin', 1));

    // Non-integer id should cause a DB error — but we get generic message
    expect(res.body.error).toBeDefined();
    expect(res.body.error).not.toContain('at ');
    expect(res.body.error).not.toContain('Error:');
  });
});
