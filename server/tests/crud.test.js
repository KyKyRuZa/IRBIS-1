import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';

const BASE = process.env.IRBIS_BASE || 'http://localhost:5000';

function buildToken(id = 1, username = 'admin', role = 'admin') {
  return Buffer.from(`${id}:${username}:${role}`).toString('base64');
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

const authHeaders = () => ({ Authorization: `Bearer ${buildToken()}` });

describe('Sites CRUD', () => {
  let createdId;

  it('creates a site', async () => {
    const { status, data } = await request('/api/sites', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ name: 'Test Site CRUD', responsible_person: 'Tester' }),
    });
    assert.strictEqual(status, 201, 'expected 201 on create');
    assert.ok(data?.id, 'expected site id');
    assert.strictEqual(data.name, 'Test Site CRUD');
    createdId = data.id;
  });

  it('lists sites', async () => {
    const { status, data } = await request('/api/sites', { headers: authHeaders() });
    assert.strictEqual(status, 200);
    assert.ok(Array.isArray(data));
  });

  it('gets a site by id', async () => {
    const { status, data } = await request(`/api/sites/${createdId}`, { headers: authHeaders() });
    assert.strictEqual(status, 200);
    assert.strictEqual(data.id, createdId);
  });

  it('updates a site', async () => {
    const { status, data } = await request(`/api/sites/${createdId}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ name: 'Updated Site CRUD', responsible_person: 'Updated' }),
    });
    assert.strictEqual(status, 200);
    assert.strictEqual(data.name, 'Updated Site CRUD');
  });

  it('deletes a site', async () => {
    const { status, data } = await request(`/api/sites/${createdId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    assert.strictEqual(status, 200);
    assert.ok(data?.message || data);
  });
});

describe('Employees CRUD', () => {
  let createdId;

  it('creates an employee', async () => {
    const { status, data } = await request('/api/employees', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ full_name: 'Test Employee CRUD', position: 'Tester' }),
    });
    assert.strictEqual(status, 201, 'expected 201 on create');
    assert.ok(data?.id, 'expected employee id');
    assert.strictEqual(data.full_name, 'Test Employee CRUD');
    createdId = data.id;
  });

  it('lists employees', async () => {
    const { status, data } = await request('/api/employees', { headers: authHeaders() });
    assert.strictEqual(status, 200);
    assert.ok(Array.isArray(data));
  });

  it('gets an employee by id', async () => {
    const { status, data } = await request(`/api/employees/${createdId}`, { headers: authHeaders() });
    assert.strictEqual(status, 200);
    assert.strictEqual(data.id, createdId);
  });

  it('updates an employee', async () => {
    const { status, data } = await request(`/api/employees/${createdId}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ full_name: 'Updated Employee CRUD', position: 'Senior Tester' }),
    });
    assert.strictEqual(status, 200);
    assert.strictEqual(data.full_name, 'Updated Employee CRUD');
  });

  it('deletes an employee', async () => {
    const { status, data } = await request(`/api/employees/${createdId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    assert.strictEqual(status, 200);
    assert.ok(data?.message || data);
  });
});

describe('Items CRUD', () => {
  let createdId;

  it('creates an item', async () => {
    const { status, data } = await request('/api/items', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ name: 'Test Item CRUD', category: 'consumable', unit: 'шт' }),
    });
    assert.strictEqual(status, 201, 'expected 201 on create');
    assert.ok(data?.id, 'expected item id');
    assert.strictEqual(data.name, 'Test Item CRUD');
    createdId = data.id;
  });

  it('lists items', async () => {
    const { status, data } = await request('/api/items', { headers: authHeaders() });
    assert.strictEqual(status, 200);
    assert.ok(Array.isArray(data));
  });

  it('gets an item by id', async () => {
    const { status, data } = await request(`/api/items/${createdId}`, { headers: authHeaders() });
    assert.strictEqual(status, 200);
    assert.strictEqual(data.id, createdId);
  });

  it('updates an item', async () => {
    const { status, data } = await request(`/api/items/${createdId}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ name: 'Updated Item CRUD', category: 'consumable', unit: 'шт' }),
    });
    assert.strictEqual(status, 200);
    assert.strictEqual(data.name, 'Updated Item CRUD');
  });

  it('deletes an item', async () => {
    const { status, data } = await request(`/api/items/${createdId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    assert.strictEqual(status, 200);
    assert.ok(data?.message || data);
  });
});

describe('Norms CRUD', () => {
  let createdId;
  let itemId;

  before(async () => {
    const items = await request('/api/items', { headers: authHeaders() });
    itemId = items.data?.[0]?.id;
  });

  it('creates a norm', async () => {
    const { status, data } = await request('/api/norms', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ item_type_id: itemId, period_months: 6, quantity: 2 }),
    });
    assert.strictEqual(status, 201, 'expected 201 on create');
    assert.ok(data?.id, 'expected norm id');
    assert.strictEqual(data.period_months, 6);
    createdId = data.id;
  });

  it('lists norms', async () => {
    const { status, data } = await request('/api/norms', { headers: authHeaders() });
    assert.strictEqual(status, 200);
    assert.ok(Array.isArray(data));
  });

  it('gets a norm by id', async () => {
    const { status, data } = await request(`/api/norms/${createdId}`, { headers: authHeaders() });
    assert.strictEqual(status, 200);
    assert.strictEqual(data.id, createdId);
  });

  it('updates a norm', async () => {
    const { status, data } = await request(`/api/norms/${createdId}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ item_type_id: itemId, period_months: 12, quantity: 4 }),
    });
    assert.strictEqual(status, 200);
    assert.strictEqual(data.period_months, 12);
  });

  it('deletes a norm', async () => {
    const { status, data } = await request(`/api/norms/${createdId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    assert.strictEqual(status, 200);
    assert.ok(data?.message || data);
  });
});

describe('Issues CRUD', () => {
  let createdId;
  let employeeId;
  let itemId;

  before(async () => {
    const employees = await request('/api/employees', { headers: authHeaders() });
    employeeId = employees.data?.[0]?.id;
    const items = await request('/api/items', { headers: authHeaders() });
    itemId = items.data?.[0]?.id;
  });

  it('creates an issue', async () => {
    const { status, data } = await request('/api/issues', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ employee_id: employeeId, item_type_id: itemId, quantity: 1 }),
    });
    assert.strictEqual(status, 201, 'expected 201 on create');
    assert.ok(data?.id, 'expected issue id');
    assert.strictEqual(data.employee_id, employeeId);
    createdId = data.id;
  });

  it('lists issues', async () => {
    const { status, data } = await request('/api/issues', { headers: authHeaders() });
    assert.strictEqual(status, 200);
    assert.ok(Array.isArray(data));
  });

  it('gets an issue by id', async () => {
    const { status, data } = await request(`/api/issues/${createdId}`, { headers: authHeaders() });
    assert.strictEqual(status, 200);
    assert.strictEqual(data.id, createdId);
  });

  it('updates an issue', async () => {
    const { status, data } = await request(`/api/issues/${createdId}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ employee_id: employeeId, item_type_id: itemId, quantity: 2 }),
    });
    assert.strictEqual(status, 200);
    assert.strictEqual(data.quantity, 2);
  });

  it('deletes an issue', async () => {
    const { status, data } = await request(`/api/issues/${createdId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    assert.strictEqual(status, 200);
    assert.ok(data?.message || data);
  });
});

describe('Certificates CRUD', () => {
  let createdId;
  let itemId;

  before(async () => {
    const items = await request('/api/items', { headers: authHeaders() });
    itemId = items.data?.[0]?.id;
  });

  it('creates a certificate', async () => {
    const { status, data } = await request('/api/certificates', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ product_name: 'Test Cert CRUD', certificate_number: 'CERT-CRUD-1', expiry_date: '2030-01-01', item_type_id: itemId }),
    });
    assert.strictEqual(status, 201, 'expected 201 on create');
    assert.ok(data?.id, 'expected certificate id');
    assert.strictEqual(data.product_name, 'Test Cert CRUD');
    createdId = data.id;
  });

  it('lists certificates', async () => {
    const { status, data } = await request('/api/certificates', { headers: authHeaders() });
    assert.strictEqual(status, 200);
    assert.ok(Array.isArray(data));
  });

  it('gets a certificate by id', async () => {
    const { status, data } = await request(`/api/certificates/${createdId}`, { headers: authHeaders() });
    assert.strictEqual(status, 200);
    assert.strictEqual(data.id, createdId);
  });

  it('updates a certificate', async () => {
    const { status, data } = await request(`/api/certificates/${createdId}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ product_name: 'Updated Cert CRUD', certificate_number: 'CERT-CRUD-1', expiry_date: '2030-01-01', item_type_id: itemId }),
    });
    assert.strictEqual(status, 200);
    assert.strictEqual(data.product_name, 'Updated Cert CRUD');
  });

  it('deletes a certificate', async () => {
    const { status, data } = await request(`/api/certificates/${createdId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    assert.strictEqual(status, 200);
    assert.ok(data?.message || data);
  });
});
