import { describe, it, expect, beforeEach } from 'vitest';
import { request, app, authHeaders, loginAs, resetDatabase } from './helpers.js';
import { prisma } from '../src/models/db.js';

const adminBase = '/api/admin';

describe('Admin — getNotifications pagination', () => {
  beforeEach(resetDatabase);

  async function seedNotifications(count) {
    const values = [];
    for (let i = 0; i < count; i++) {
      values.push(`(
        'test_notif_${i}',
        'test_type',
        'info',
        'Test notification ${i}',
        NULL,
        NULL,
        '${new Date(Date.now() - i * 1000000).toISOString()}',
        FALSE,
        NOW()
      )`);
    }
    const sql = `INSERT INTO notifications (notification_id, type, severity, message, employee_id, site_id, date, read, created_at) VALUES ${values.join(', ')}`;
    await prisma.$executeRawUnsafe(sql);
  }

  it('requires authentication', async () => {
    const res = await request(app).get(`${adminBase}/notifications`);
    expect(res.status).toBe(401);
  });

  it('returns empty paginated response when no notifications', async () => {
    const admin = await loginAs('admin');
    const res = await admin.get(`${adminBase}/notifications`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.pagination).toHaveProperty('page', 1);
    expect(res.body.pagination).toHaveProperty('limit', 50);
    expect(res.body.pagination).toHaveProperty('total', 0);
  });

  it('returns paginated notifications with correct structure', async () => {
    await seedNotifications(5);
    const admin = await loginAs('admin');
    const res = await admin.get(`${adminBase}/notifications`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data).toHaveLength(5);
    expect(res.body.pagination.total).toBe(5);
    expect(res.body.pagination.page).toBe(1);
  });

  it('supports page and limit parameters', async () => {
    await seedNotifications(10);
    const admin = await loginAs('admin');
    const res = await admin.get(`${adminBase}/notifications`).query({ page: 2, limit: 3 });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(3);
    expect(res.body.pagination.page).toBe(2);
    expect(res.body.pagination.limit).toBe(3);
    expect(res.body.pagination.total).toBe(10);
  });

  it('sets X-Pagination header', async () => {
    await seedNotifications(5);
    const admin = await loginAs('admin');
    const res = await admin.get(`${adminBase}/notifications`).query({ page: 1, limit: 2 });

    const header = res.headers['x-pagination'];
    expect(header).toBeDefined();
    const parsed = JSON.parse(header);
    expect(parsed.page).toBe(1);
    expect(parsed.limit).toBe(2);
    expect(parsed.total).toBe(5);
  });

  it('marks all notifications as read', async () => {
    await seedNotifications(3);
    const admin = await loginAs('admin');

    const res = await admin.patch(`${adminBase}/notifications/read-all`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const allRead = await prisma.notification.findMany();
    allRead.forEach((n) => {
      expect(n.read).toBe(true);
    });
  });

  it('marks a single notification as read', async () => {
    await seedNotifications(1);
    const admin = await loginAs('admin');

    const notif = await prisma.notification.findFirst();
    const res = await admin.patch(`${adminBase}/notifications/${notif.notification_id}/read`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const updated = await prisma.notification.findUnique({
      where: { notification_id: notif.notification_id },
    });
    expect(updated.read).toBe(true);
  });

  it('caps limit at 200', async () => {
    await seedNotifications(5);
    const admin = await loginAs('admin');
    const res = await admin.get(`${adminBase}/notifications`).query({ limit: 1000 });

    expect(res.status).toBe(200);
    expect(res.body.pagination.limit).toBe(200);
  });

  it('defaults to page 1 and limit 50', async () => {
    await seedNotifications(3);
    const admin = await loginAs('admin');
    const res = await admin.get(`${adminBase}/notifications`);

    expect(res.status).toBe(200);
    expect(res.body.pagination.page).toBe(1);
    expect(res.body.pagination.limit).toBe(50);
  });

  it('requires admin for all endpoints', async () => {
    const user = await loginAs('user');
    expect((await user.get(`${adminBase}/notifications`)).status).toBe(403);
    expect((await user.get(`${adminBase}/demand`)).status).toBe(403);
    expect((await user.get(`${adminBase}/backup`)).status).toBe(403);
  });
});
