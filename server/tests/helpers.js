// Shared test harness: isolated database reset, authentication helpers and
// small factories that drive the real Express app through supertest.

import request from 'supertest';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import app from '../src/index.js';
import { prisma } from '../src/models/db.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-irbis';

// ---------------------------------------------------------------------------
// Database isolation
// ---------------------------------------------------------------------------

export async function resetDatabase() {
  const rows = await prisma.$queryRawUnsafe(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public'`
  );
  const skip = new Set(['_prisma_migrations']);
  const tables = rows
    .map((r) => r.tablename)
    .filter((name) => name && !skip.has(name));
  if (tables.length) {
    await prisma.$executeRawUnsafe(
      `TRUNCATE TABLE "${tables.join('", "')}" RESTART IDENTITY CASCADE`
    );
  }
}

// ---------------------------------------------------------------------------
// Authentication helpers
// ---------------------------------------------------------------------------

export function makeToken(role = 'admin', id = 1) {
  return jwt.sign(
    { id, username: role === 'admin' ? 'admin' : 'tester', role },
    JWT_SECRET
  );
}

export function authHeaders(role = 'admin', id = 1) {
  return { Authorization: `Bearer ${makeToken(role, id)}` };
}

async function ensureAdmin() {
  const hash = await bcrypt.hash('adminpass', 10);
  return prisma.user.upsert({
    where: { username: 'admin' },
    update: { passwordHash: hash, role: 'admin' },
    create: { username: 'admin', passwordHash: hash, role: 'admin' },
  });
}

async function ensureNormalUser() {
  const hash = await bcrypt.hash('userpass', 10);
  return prisma.user.upsert({
    where: { username: 'tester' },
    update: { passwordHash: hash, role: 'user' },
    create: { username: 'tester', passwordHash: hash, role: 'user' },
  });
}

// Returns a supertest agent that is already logged in as the given role.
export async function loginAs(role = 'admin') {
  const user = role === 'admin' ? await ensureAdmin() : await ensureNormalUser();
  const agent = request.agent(app);
  const res = await agent
    .post('/api/auth/login')
    .send({
      username: user.username,
      password: role === 'admin' ? 'adminpass' : 'userpass',
    });
  if (res.status !== 200) {
    throw new Error(`loginAs(${role}) failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return agent;
}

// ---------------------------------------------------------------------------
// Resource factories (self-contained — create their own admin auth + deps)
// ---------------------------------------------------------------------------

async function adminPost(path, payload, label) {
  const res = await request(app).post(path).set(authHeaders('admin', 1)).send(payload);
  if (res.status >= 400) {
    throw new Error(`${label} failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body;
}

export async function createSite(overrides = {}) {
  return adminPost('/api/sites', { name: 'Main Site', responsible_person: 'Boss', ...overrides }, 'createSite');
}

export async function createItem(overrides = {}) {
  return adminPost(
    '/api/items',
    {
      name: 'Hard Hat',
      category: 'siz',
      unit: 'шт',
      default_wear_time: 12,
      seasonality: 'year_round',
      requires_certificate: false,
      ...overrides,
    },
    'createItem'
  );
}

export async function createEmployee(overrides = {}) {
  return adminPost(
    '/api/employees',
    {
      full_name: 'Ivan Petrov',
      position: 'Worker',
      gender: 'male',
      hire_date: '2024-01-01',
      clothing_size: 'L',
      shoe_size: '42',
      height: 180,
      personnel_number: 'P001',
      ...overrides,
    },
    'createEmployee'
  );
}

export async function createCertificate(overrides = {}) {
  const item_type_id = overrides.item_type_id ?? (await createItem()).id;
  return adminPost(
    '/api/certificates',
    {
      product_name: 'Cert Product',
      certificate_number: 'CERT-1',
      issue_date: '2024-01-01',
      expiry_date: '2025-01-01',
      item_type_id,
      ...overrides,
    },
    'createCertificate'
  );
}

export async function createNorm(overrides = {}) {
  const item_type_id = overrides.item_type_id ?? (await createItem()).id;
  return adminPost(
    '/api/norms',
    {
      item_type_id,
      period_months: 6,
      quantity: 2,
      gender: 'male',
      position: 'Worker',
      ...overrides,
    },
    'createNorm'
  );
}

export async function createIssue(overrides = {}) {
  const employee_id = overrides.employee_id ?? (await createEmployee()).id;
  const item_type_id = overrides.item_type_id ?? (await createItem()).id;
  const site_id = overrides.site_id ?? (await createSite()).id;
  return adminPost(
    '/api/issues',
    {
      employee_id,
      item_type_id,
      site_id,
      quantity: 1,
      issue_date: '2024-06-01',
      ...overrides,
    },
    'createIssue'
  );
}

export async function createForm(overrides = {}) {
  const employee_id = overrides.employee_id ?? (await createEmployee()).id;
  return adminPost(
    '/api/forms',
    { name: 'Safety Form', description: 'Monthly safety acknowledgement', employee_id, ...overrides },
    'createForm'
  );
}

export async function createPushSubscription(overrides = {}) {
  const employee_id = overrides.employee_id ?? (await createEmployee()).id;
  return adminPost(
    '/api/push/subscribe',
    {
      endpoint: 'https://example.com/push/abc',
      keys: { p256dh: 'p256dh-key', auth: 'auth-key' },
      employee_id,
      ...overrides,
    },
    'createPushSubscription'
  );
}

export { request };
export { app };
