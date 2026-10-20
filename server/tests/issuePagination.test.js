import { describe, it, expect, beforeEach } from 'vitest';
import { request, app, authHeaders, createSite, createItem, createEmployee, createIssue, resetDatabase } from './helpers.js';

const base = '/api/issues';

describe('Issues — listIssues pagination and filters', () => {
  beforeEach(resetDatabase);

  it('returns paginated response with X-Pagination header', async () => {
    for (let i = 0; i < 5; i++) {
      await createIssue({});
    }

    const res = await request(app)
      .get(base)
      .set(authHeaders('admin', 1))
      .query({ page: 1, limit: 10 });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.pagination).toHaveProperty('page', 1);
    expect(res.body.pagination).toHaveProperty('limit', 10);
    expect(res.body.pagination).toHaveProperty('total');
    expect(res.body.pagination.total).toBeGreaterThanOrEqual(5);

    const paginationHeader = res.headers['x-pagination'];
    expect(paginationHeader).toBeDefined();
    const parsed = JSON.parse(paginationHeader);
    expect(parsed.page).toBe(1);
    expect(parsed.limit).toBe(10);
  });

  it('respects page and limit parameters', async () => {
    for (let i = 0; i < 10; i++) {
      await createIssue({});
    }

    const res = await request(app)
      .get(base)
      .set(authHeaders('admin', 1))
      .query({ page: 2, limit: 3 });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(3);
    expect(res.body.pagination.page).toBe(2);
    expect(res.body.pagination.limit).toBe(3);
    expect(res.body.pagination.total).toBe(10);
  });

  it('filters by employee_id', async () => {
    const emp1 = await createEmployee();
    const emp2 = await createEmployee({ full_name: 'Second Employee', personnel_number: 'P002' });

    await createIssue({ employee_id: emp1.id });
    await createIssue({ employee_id: emp2.id });

    const res = await request(app)
      .get(base)
      .set(authHeaders('admin', 1))
      .query({ employee_id: emp1.id });

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].employee_id).toBe(emp1.id);
  });

  it('filters by status', async () => {
    const issue1 = await createIssue({});
    await request(app)
      .patch(`${base}/${issue1.id}/return`)
      .set(authHeaders('admin', 1))
      .send({ return_quantity: 1 });

    const res = await request(app)
      .get(base)
      .set(authHeaders('admin', 1))
      .query({ status: 'returned' });

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].status).toBe('returned');
  });

  it('filters by date range', async () => {
    const site = await createSite();
    const item = await createItem();
    const emp = await createEmployee();

    await request(app)
      .post(base)
      .set(authHeaders('admin', 1))
      .send({
        employee_id: emp.id,
        item_type_id: item.id,
        site_id: site.id,
        quantity: 1,
        issue_date: '2024-01-15',
      });

    await request(app)
      .post(base)
      .set(authHeaders('admin', 1))
      .send({
        employee_id: emp.id,
        item_type_id: item.id,
        site_id: site.id,
        quantity: 1,
        issue_date: '2025-06-20',
      });

    const res = await request(app)
      .get(base)
      .set(authHeaders('admin', 1))
      .query({ date_from: '2024-01-01', date_to: '2024-12-31' });

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].issue_date.slice(0, 10)).toBe('2024-01-15');
  });

  it('filters by issue_method', async () => {
    const issue1 = await createIssue({ issue_method: 'dosator' });
    await createIssue({ issue_method: 'personal' });

    const res = await request(app)
      .get(base)
      .set(authHeaders('admin', 1))
      .query({ issue_method: 'dosator' });

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].issue_method).toBe('dosator');
  });

  it('filters by site_id', async () => {
    const site1 = await createSite();
    const site2 = await createSite({ name: 'Other Site' });

    const emp1 = await createEmployee({ site_id: site1.id });
    const emp2 = await createEmployee({ site_id: site2.id, full_name: 'Second Employee', personnel_number: 'P002' });

    await createIssue({ employee_id: emp1.id, site_id: site1.id });
    await createIssue({ employee_id: emp2.id, site_id: site2.id });

    const res = await request(app)
      .get(base)
      .set(authHeaders('admin', 1))
      .query({ site_id: site1.id });

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
  });

  it('defaults to limit=50 and page=1', async () => {
    for (let i = 0; i < 60; i++) {
      await createIssue({});
    }

    const res = await request(app)
      .get(base)
      .set(authHeaders('admin', 1));

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(50);
    expect(res.body.pagination.page).toBe(1);
    expect(res.body.pagination.limit).toBe(50);
  });

  it('caps limit at 200', async () => {
    for (let i = 0; i < 5; i++) {
      await createIssue({});
    }

    const res = await request(app)
      .get(base)
      .set(authHeaders('admin', 1))
      .query({ limit: 1000 });

    expect(res.status).toBe(200);
    expect(res.body.pagination.limit).toBe(200);
  });

  it('includes sheet_number in list response', async () => {
    const issue = await createIssue({});
    const res = await request(app)
      .get(base)
      .set(authHeaders('admin', 1));

    expect(res.status).toBe(200);
    const found = res.body.data.find(r => r.id === issue.id);
    expect(found).toBeDefined();
    expect(found.sheet_number).toBeDefined();
  });

  it('requires authentication', async () => {
    const res = await request(app).get(base);
    expect(res.status).toBe(401);
  });
});

describe('Issues — listIssues default page fallback', () => {
  beforeEach(resetDatabase);

  it('handles invalid page and limit values gracefully', async () => {
    await createIssue({});

    const res = await request(app)
      .get(base)
      .set(authHeaders('admin', 1))
      .query({ page: 'abc', limit: 'xyz' });

    expect(res.status).toBe(200);
    expect(res.body.pagination.page).toBe(1);
    expect(res.body.pagination.limit).toBe(50);
  });

  it('handles page=0 by defaulting to page 1', async () => {
    await createIssue({});

    const res = await request(app)
      .get(base)
      .set(authHeaders('admin', 1))
      .query({ page: 0, limit: 10 });

    expect(res.status).toBe(200);
    expect(res.body.pagination.page).toBe(1);
  });

  it('handles negative limit by defaulting to 1', async () => {
    await createIssue({});

    const res = await request(app)
      .get(base)
      .set(authHeaders('admin', 1))
      .query({ limit: -5 });

    expect(res.status).toBe(200);
    expect(res.body.pagination.limit).toBe(1);
  });
});
