import { describe, it, expect } from 'vitest';
import {
  request,
  app,
  authHeaders,
  createSite,
  createItem,
  createEmployee,
} from './helpers.js';

describe('Uploads', () => {
  it('requires auth for certificate upload', async () => {
    expect((await request(app).post('/api/upload/certificate')).status).toBe(401);
  });

  it('requires admin for certificate upload', async () => {
    const res = await request(app)
      .post('/api/upload/certificate')
      .set(authHeaders('user', 2))
      .attach('certificate', Buffer.from('pdf'), 'cert.pdf');
    expect(res.status).toBe(403);
  });

  it('rejects a certificate upload without a file', async () => {
    const res = await request(app)
      .post('/api/upload/certificate')
      .set(authHeaders('admin', 1))
      .field('product_name', 'Helmet');
    expect(res.status).toBe(400);
  });

  it('uploads a certificate (admin)', async () => {
    const res = await request(app)
      .post('/api/upload/certificate')
      .set(authHeaders('admin', 1))
      .field('product_name', 'Helmet')
      .field('certificate_number', 'C-9')
      .attach('certificate', Buffer.from('%PDF-1.4 fake'), 'cert.pdf');
    expect(res.status).toBe(201);
    expect(res.body.file_path).toContain('certificates');
  });

  it('uploads a signature for an issue record', async () => {
    const site = await createSite();
    const item = await createItem();
    const emp = await createEmployee();
    const issue = await request(app)
      .post('/api/issues')
      .set(authHeaders('admin', 1))
      .send({
        employee_id: emp.id,
        item_type_id: item.id,
        site_id: site.id,
        quantity: 1,
        issued_by: 1,
      });
    const issueId = issue.body.id;
    const res = await request(app)
      .post('/api/upload/signature')
      .set(authHeaders('admin', 1))
      .field('issue_record_id', issueId)
      .attach('signature', Buffer.from('sig'), 'sig.png');
    expect(res.status).toBe(200);
    expect(res.body.signature_path).toContain('signatures');
  });
});
