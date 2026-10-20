import { describe, it, expect, beforeEach } from 'vitest';
import { request, app, authHeaders, loginAs, createSite, createItem, createEmployee, createIssue, resetDatabase } from './helpers.js';
import { prisma } from '../src/models/db.js';
import fs from 'node:fs';
import path from 'node:path';

const uploadBase = '/api/upload';
const issuesBase = '/api/issues';

describe('Upload — signature', () => {
  beforeEach(resetDatabase);

  it('requires authentication', async () => {
    const res = await request(app).post(`${uploadBase}/signature`);
    expect(res.status).toBe(401);
  });

  it('rejects upload without a file', async () => {
    const admin = await loginAs('admin');
    const res = await admin
      .post(`${uploadBase}/signature`)
      .field('issue_record_id', '1');
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Файл обязателен');
  });

  it('rejects upload without issue_record_id', async () => {
    const admin = await loginAs('admin');
    const pngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'base64'
    );

    const res = await admin
      .post(`${uploadBase}/signature`)
      .attach('signature', pngBuffer, 'signature.png');

    expect(res.status).toBe(400);
  });

  it('rejects issue_record_id that does not exist', async () => {
    const admin = await loginAs('admin');
    const pngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'base64'
    );

    const res = await admin
      .post(`${uploadBase}/signature`)
      .field('issue_record_id', '99999')
      .attach('signature', pngBuffer, 'signature.png');

    expect(res.status).toBe(404);
    expect(res.body.error).toContain('Issue record not found');
  });

  it('rejects unsupported file types', async () => {
    const site = await createSite();
    const item = await createItem();
    const emp = await createEmployee();
    const issue = await createIssue({ employee_id: emp.id, item_type_id: item.id, site_id: site.id });

    const admin = await loginAs('admin');
    const res = await admin
      .post(`${uploadBase}/signature`)
      .field('issue_record_id', issue.id)
      .attach('signature', Buffer.from('not an image'), 'signature.txt');

    // multer fileFilter rejects unsupported file extensions
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('allows admin to upload a valid signature for any employee issue', async () => {
    const site = await createSite();
    const item = await createItem();
    const emp = await createEmployee();
    const issue = await createIssue({ employee_id: emp.id, item_type_id: item.id, site_id: site.id });

    const admin = await loginAs('admin');
    const pngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'base64'
    );

    const res = await admin
      .post(`${uploadBase}/signature`)
      .field('issue_record_id', issue.id)
      .attach('signature', pngBuffer, 'signature.png');

    expect(res.status).toBe(200);
    expect(res.body.signature_path).toBeDefined();
    expect(res.body.signature_path).toContain('/uploads/signatures/');
    expect(res.body.signature_date).toBeDefined();
  });

  it('allows employee to upload their own signature', async () => {
    const site = await createSite();
    const item = await createItem();
    const emp = await createEmployee();
    const issue = await createIssue({ employee_id: emp.id, item_type_id: item.id, site_id: site.id });

    // Create a user linked to this employee
    const user = await prisma.user.create({
      data: {
        username: 'empuser',
        passwordHash: '$2b$10$abcdefghijklmnopqrstuuZJrX1gOqKqKqKqKqKqK.Ou', // valid bcrypt-ish hash
        role: 'user',
      },
    });
    await prisma.employee.update({
      where: { id: emp.id },
      data: { userId: user.id },
    });

    const agent = await loginAs('user');
    // But we need to login as the employee's user... loginAs creates a generic user.
    // Instead test the permission logic via direct auth headers
    const jwt = await import('jsonwebtoken');
    const token = jwt.default.sign(
      { id: user.id, username: 'empuser', role: 'user' },
      process.env.JWT_SECRET || 'test-jwt-secret-irbis'
    );

    // We need to use the actual JWT secret and structure that auth.js expects
    // The auth middleware does: decoded = jwt.verify(token, JWT_SECRET); req.user = { id, username, role }
    // And uploadSignature checks req.user.role === 'admin' OR employee.user_id === req.user.id
    const res = await request(app)
      .post(`${uploadBase}/signature`)
      .set('Authorization', `Bearer ${token}`)
      .field('issue_record_id', issue.id)
      .attach('signature', Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        'base64'
      ), 'signature.png');

    expect(res.status).toBe(200);
    expect(res.body.signature_path).toBeDefined();
  });

  it('rejects employee uploading signature for another employee\'s issue', async () => {
    const site1 = await createSite();
    const site2 = await createSite({ name: 'Other Site' });
    const item = await createItem();
    const emp1 = await createEmployee({ site_id: site1.id });
    const emp2 = await createEmployee({ site_id: site2.id, full_name: 'Other Emp', personnel_number: 'P002' });

    const issue2 = await createIssue({ employee_id: emp2.id, item_type_id: item.id, site_id: site2.id });

    // Create user linked to emp1
    const user = await prisma.user.create({
      data: {
        username: 'emp1user',
        passwordHash: '$2b$10$abcdefghijklmnopqrstuuZJrX1gOqKqKqKqKqK.Ou',
        role: 'user',
      },
    });
    await prisma.employee.update({
      where: { id: emp1.id },
      data: { userId: user.id },
    });

    const jwt = await import('jsonwebtoken');
    const token = jwt.default.sign(
      { id: user.id, username: 'emp1user', role: 'user' },
      process.env.JWT_SECRET || 'test-jwt-secret-irbis'
    );

    const res = await request(app)
      .post(`${uploadBase}/signature`)
      .set('Authorization', `Bearer ${token}`)
      .field('issue_record_id', issue2.id)
      .attach('signature', Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        'base64'
      ), 'signature.png');

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Forbidden');
  });
});

describe('Upload — certificate', () => {
  beforeEach(resetDatabase);

  it('requires admin for certificate upload', async () => {
    const userAgent = await loginAs('user');
    const pngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'base64'
    );
    const res = await userAgent
      .post(`${uploadBase}/certificate`)
      .field('product_name', 'Test Cert')
      .attach('certificate', pngBuffer, 'cert.png');
    expect(res.status).toBe(403);
  });

  it('requires product_name', async () => {
    const admin = await loginAs('admin');
    const pngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'base64'
    );
    const res = await admin
      .post(`${uploadBase}/certificate`)
      .attach('certificate', pngBuffer, 'cert.png');
    expect(res.status).toBe(400);
  });

  it('allows admin to upload a certificate', async () => {
    const admin = await loginAs('admin');
    const pngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'base64'
    );
    const res = await admin
      .post(`${uploadBase}/certificate`)
      .field('product_name', 'My Certificate')
      .field('certificate_number', 'CERT-001')
      .attach('certificate', pngBuffer, 'cert.png');
    expect(res.status).toBe(201);
    expect(res.body.product_name).toBe('My Certificate');
    expect(res.body.certificate_number).toBe('CERT-001');
    expect(res.body.file_path).toBeDefined();
  });

  it('updates existing certificate when certificate_id provided', async () => {
    const admin = await loginAs('admin');
    const item = await createItem();
    const certRes = await admin
      .post('/api/certificates')
      .send({
        product_name: 'Original',
        certificate_number: 'ORIG-001',
        item_type_id: item.id,
      });
    const certId = certRes.body.id;

    const pngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'base64'
    );
    const res = await admin
      .post(`${uploadBase}/certificate`)
      .field('product_name', 'Updated')
      .field('certificate_number', 'UPD-001')
      .field('certificate_id', certId)
      .attach('certificate', pngBuffer, 'cert.png');

    expect(res.status).toBe(200);
    expect(res.body.product_name).toBe('Updated');
    expect(res.body.certificate_number).toBe('UPD-001');
  });
});
