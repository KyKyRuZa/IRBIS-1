import jwt from 'jsonwebtoken';
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';

const BASE = process.env.IRBIS_BASE || 'http://localhost:5000';

function buildToken(id = 1, username = 'admin', role = 'admin') {
  return jwt.sign({ id, username, role }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '8h' });
}

async function request(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
  });
  const text = await res.text();
  let data = null;
  try { data = JSON.parse(text); } catch (_) { data = text; }
  return { status: res.status, data };
}

describe('Auth and access control', () => {
  it('rejects unauthenticated access to admin demand', async () => {
    const { status, data } = await request('/api/admin/demand');
    assert.strictEqual(status, 401, 'expected 401 without token');
    assert.ok(data?.error, 'expected error message');
  });

  it('rejects non-admin access to admin demand', async () => {
    const token = buildToken(2, 'user', 'user');
    const { status, data } = await request('/api/admin/demand', {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.strictEqual(status, 403, 'expected 403 for non-admin');
    assert.ok(data?.error, 'expected error message');
  });

  it('allows admin access to admin demand', async () => {
    const token = buildToken(1, 'admin', 'admin');
    const { status, data } = await request('/api/admin/demand', {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.strictEqual(status, 200, 'expected 200 for admin');
    assert.ok(Array.isArray(data), 'expected array response');
  });

  it('rejects unauthenticated access to reports', async () => {
    const { status, data } = await request('/api/reports/demand');
    assert.strictEqual(status, 401, 'expected 401 without token');
    assert.ok(data?.error, 'expected error message');
  });

  it('rejects non-admin access to reports', async () => {
    const token = buildToken(2, 'user', 'user');
    const { status, data } = await request('/api/reports/demand', {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.strictEqual(status, 403, 'expected 403 for non-admin');
    assert.ok(data?.error, 'expected error message');
  });

  it('allows admin access to reports demand', async () => {
    const token = buildToken(1, 'admin', 'admin');
    const { status, data } = await request('/api/reports/demand', {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.strictEqual(status, 200, 'expected 200 for admin');
    assert.ok(Array.isArray(data), 'expected array response');
  });

  it('rejects unauthenticated access to exports', async () => {
    const { status, data } = await request('/api/export/demand/excel');
    assert.strictEqual(status, 401, 'expected 401 without token');
    assert.ok(data?.error, 'expected error message');
  });

  it('rejects non-admin access to exports', async () => {
    const token = buildToken(2, 'user', 'user');
    const { status, data } = await request('/api/export/demand/excel', {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.strictEqual(status, 403, 'expected 403 for non-admin');
    assert.ok(data?.error, 'expected error message');
  });

  it('allows admin access to exports demand excel', async () => {
    const token = buildToken(1, 'admin', 'admin');
    const { status, data } = await request('/api/export/demand/excel?site_id=1', {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.strictEqual(status, 200, 'expected 200 for admin');
  });
});

describe('Issue records and wear time override', () => {
  it('creates an issue record and stores wear_time_override_months when provided', async () => {
    const token = buildToken(1, 'admin', 'admin');

    const sites = await request('/api/sites', {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.strictEqual(sites.status, 200, 'expected sites list');
    const siteId = sites.data?.[0]?.id;
    assert.ok(siteId, 'expected at least one site');

    const employees = await request(`/api/employees?site_id=${siteId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.strictEqual(employees.status, 200, 'expected employees list');
    const employeeId = employees.data?.[0]?.id;
    assert.ok(employeeId, 'expected at least one employee');

    const items = await request('/api/items', {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.strictEqual(items.status, 200, 'expected items list');
    const itemId = items.data?.[0]?.id;
    assert.ok(itemId, 'expected at least one item type');

    const issuePayload = {
      employee_id: employeeId,
      item_type_id: itemId,
      quantity: 1,
      wear_time_override: 11,
    };

    const issueRes = await request('/api/issues', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(issuePayload),
    });

    assert.strictEqual(issueRes.status, 201, 'expected 201 on issue');
    assert.ok(issueRes.data, 'expected issue record response');
    assert.strictEqual(
      issueRes.data.wear_time_override_months,
      11,
      'expected wear_time_override_months to be 11'
    );
  });
});
