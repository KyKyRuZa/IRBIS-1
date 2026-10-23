import { describe, it, expect, beforeEach } from 'vitest';
import { request, app, authHeaders, createSite, createItem, createEmployee, createCertificate, resetDatabase } from './helpers.js';
import { prisma } from '../src/models/db.js';

const base = '/api/issues';

describe('Issues — status transition protection (P1.6)', () => {
  beforeEach(resetDatabase);

  async function seedIssue() {
    const site = await createSite();
    const item = await createItem();
    const emp = await createEmployee();
    const res = await request(app)
      .post(base)
      .set(authHeaders('admin', 1))
      .send({ employee_id: emp.id, item_type_id: item.id, quantity: 1 });
    return res.body;
  }

  it('prevents changing status via PUT (must use /dispose or /return)', async () => {
    const issue = await seedIssue();
    const res = await request(app)
      .put(`${base}/${issue.id}`)
      .set(authHeaders('admin', 1))
      .send({ status: 'returned', return_date: '2026-10-01', return_quantity: 1 });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('специализированные эндпоинты');
  });

  it('prevents disposed status via PUT', async () => {
    const issue = await seedIssue();
    const res = await request(app)
      .put(`${base}/${issue.id}`)
      .set(authHeaders('admin', 1))
      .send({ status: 'disposed' });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('специализированные эндпоинты');
  });

  it('allows updating other fields via PUT without status', async () => {
    const issue = await seedIssue();
    const res = await request(app)
      .put(`${base}/${issue.id}`)
      .set(authHeaders('admin', 1))
      .send({ quantity: 5, notes: 'updated' });
    expect(res.status).toBe(200);
    expect(res.body.quantity).toBe(5);
    expect(res.body.notes).toBe('updated');
  });

  it('still allows dispose via dedicated endpoint', async () => {
    const issue = await seedIssue();
    const res = await request(app)
      .patch(`${base}/${issue.id}/dispose`)
      .set(authHeaders('admin', 1));
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('disposed');
  });

  it('still allows return via dedicated endpoint', async () => {
    const issue = await seedIssue();
    const res = await request(app)
      .patch(`${base}/${issue.id}/return`)
      .set(authHeaders('admin', 1))
      .send({ return_quantity: 1 });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('returned');
  });
});

describe('Issues — certificate validation (P1.7)', () => {
  beforeEach(resetDatabase);

  it('rejects issuing with a certificate that does not match item type', async () => {
    const site = await createSite();
    const item = await createItem({ requires_certificate: true });
    const otherItem = await createItem({ requires_certificate: true, name: 'Other Item' });
    const emp = await createEmployee();

    const cert = await createCertificate({ item_type_id: otherItem.id });

    const res = await request(app)
      .post('/api/issues')
      .set(authHeaders('admin', 1))
      .send({
        employee_id: emp.id,
        item_type_id: item.id,
        quantity: 1,
        certificate_id: cert.id,
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('does not match');
  });

  it('rejects issuing with an expired certificate', async () => {
    const site = await createSite();
    const item = await createItem({ requires_certificate: true });
    const emp = await createEmployee();

    const cert = await request(app)
      .post('/api/certificates')
      .set(authHeaders('admin', 1))
      .send({
        product_name: 'Expired Cert',
        certificate_number: 'EXP-1',
        issue_date: '2020-01-01',
        expiry_date: '2020-06-01',
        item_type_id: item.id,
        status: 'active',
      });

    const res = await request(app)
      .post('/api/issues')
      .set(authHeaders('admin', 1))
      .send({
        employee_id: emp.id,
        item_type_id: item.id,
        quantity: 1,
        certificate_id: cert.body.id,
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('expired or inactive');
  });

  it('rejects issuing with a non-active certificate', async () => {
    const site = await createSite();
    const item = await createItem({ requires_certificate: true });
    const emp = await createEmployee();

    const cert = await request(app)
      .post('/api/certificates')
      .set(authHeaders('admin', 1))
      .send({
        product_name: 'Inactive Cert',
        certificate_number: 'INACT-1',
        issue_date: '2024-01-01',
        expiry_date: '2026-12-31',
        item_type_id: item.id,
        status: 'revoked',
      });

    const res = await request(app)
      .post('/api/issues')
      .set(authHeaders('admin', 1))
      .send({
        employee_id: emp.id,
        item_type_id: item.id,
        quantity: 1,
        certificate_id: cert.body.id,
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('expired or inactive');
  });

  it('rejects issuing with a non-existent certificate_id', async () => {
    const site = await createSite();
    const item = await createItem();
    const emp = await createEmployee();

    const res = await request(app)
      .post('/api/issues')
      .set(authHeaders('admin', 1))
      .send({
        employee_id: emp.id,
        item_type_id: item.id,
        quantity: 1,
        certificate_id: 99999,
      });

    expect(res.status).toBe(404);
    expect(res.body.error).toContain('Certificate not found');
  });

  it('allows issuing with a valid active certificate', async () => {
    const site = await createSite();
    const item = await createItem({ requires_certificate: true });
    const emp = await createEmployee();

    const cert = await request(app)
      .post('/api/certificates')
      .set(authHeaders('admin', 1))
      .send({
        product_name: 'Valid Cert',
        certificate_number: 'VALID-1',
        issue_date: '2024-01-01',
        expiry_date: '2026-12-31',
        item_type_id: item.id,
        status: 'active',
      });

    const res = await request(app)
      .post('/api/issues')
      .set(authHeaders('admin', 1))
      .send({
        employee_id: emp.id,
        item_type_id: item.id,
        quantity: 1,
        certificate_id: cert.body.id,
      });

    expect(res.status).toBe(201);
  });
});
