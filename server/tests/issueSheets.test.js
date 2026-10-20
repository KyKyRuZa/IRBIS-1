import { describe, it, expect, beforeEach } from 'vitest';
import { request, app, authHeaders, loginAs, createSite, createItem, createEmployee, fetchExport, resetDatabase } from './helpers.js';

const exportBase = '/api/export';

// Выдачи и листы нумеруются по дате, поэтому тесту нужна чистая БД:
// иначе записи прошлых прогонов меняют номера листов и состав пачек.
beforeEach(resetDatabase);

async function createIssue(employeeId, itemId, siteId, issueDate, quantity = 1) {
  const res = await request(app)
    .post('/api/issues')
    .set(authHeaders('admin', 1))
    .send({ employee_id: employeeId, item_type_id: itemId, site_id: siteId, quantity, issue_date: issueDate });
  expect(res.status).toBe(201);
  return res.body;
}

async function readDocxText(buffer) {
  const AdapterZip = (await import('adm-zip')).default;
  return new AdapterZip(buffer).readAsText('word/document.xml').replace(/<[^>]+>/g, '');
}

describe('Issue sheets & card parts (admin)', () => {
  it('exports the title sheet of the card by default', async () => {
    const admin = await loginAs('admin');
    const emp = await createEmployee({ full_name: 'Уварова Анна Ивановна', personnel_number: 'П-1' });
    const res = await fetchExport(admin, `${exportBase}/employee-card/${emp.id}`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('wordprocessingml.document');
    expect(Buffer.isBuffer(res.body)).toBe(true);

    const text = await readDocxText(res.body);
    expect(text).toContain('Уварова');
    expect(text).toContain('П-1');
    expect(text).not.toContain('undefined');
    // На титульном листе нет журнала выдачи — он печатается отдельными листами
    expect(text).not.toContain('ЖУРНАЛ');
  });

  it('rejects a sheet request without issue_date', async () => {
    const admin = await loginAs('admin');
    const emp = await createEmployee();
    const res = await fetchExport(admin, `${exportBase}/employee-card/${emp.id}`, { part: 'sheet' });
    expect(res.status).toBe(400);
  });

  it('exports a single issue sheet with only that event items', async () => {
    const admin = await loginAs('admin');
    const site = await createSite();
    const first = await createItem({ name: 'Крем защитный' });
    const second = await createItem({ name: 'Мыло' });
    const emp = await createEmployee({ site_id: site.id });

    await createIssue(emp.id, first.id, site.id, '2026-01-10', 300);
    await createIssue(emp.id, second.id, site.id, '2026-01-10', 750);
    await createIssue(emp.id, first.id, site.id, '2026-04-10', 300);

    const res = await fetchExport(admin, `${exportBase}/employee-card/${emp.id}`, {
      part: 'sheet',
      issue_date: '2026-04-10',
    });
    expect(res.status).toBe(200);

    const text = await readDocxText(res.body);
    // Только позиции выдачи от 10.04, без выдачи от 10.01
    expect(text).toContain('Крем защитный');
    expect(text).not.toContain('Мыло');
    // ФИО сотрудника присутствует в листе
    expect(text).toContain(emp.full_name.split(' ')[0]);
  });

  it('returns 404 for a sheet of a date without issues', async () => {
    const admin = await loginAs('admin');
    const emp = await createEmployee();
    const res = await fetchExport(admin, `${exportBase}/employee-card/${emp.id}`, {
      part: 'sheet',
      issue_date: '2020-01-01',
    });
    expect(res.status).toBe(404);
  });

  it('numbers issue sheets sequentially and resets per year', async () => {
    const admin = await loginAs('admin');
    const site = await createSite();
    const item = await createItem();
    const emp = await createEmployee({ site_id: site.id });

    await createIssue(emp.id, item.id, site.id, '2026-01-10');
    await createIssue(emp.id, item.id, site.id, '2026-04-10');
    await createIssue(emp.id, item.id, site.id, '2027-02-10');

    const list = await admin.get('/api/issues').query({ employee_id: emp.id });
    expect(list.status).toBe(200);
    const sheets = list.body.map((r) => [(r.issue_date || '').slice(0, 10), Number(r.sheet_number)]);
    // 2026: две выдачи → листы 2 и 3; 2027: нумерация с нуля → лист 2
    expect(sheets).toEqual(
      expect.arrayContaining([
        ['2026-01-10', 2],
        ['2026-04-10', 3],
        ['2027-02-10', 2],
      ])
    );
  });

  it('zips all sheets of an employee for a year', async () => {
    const admin = await loginAs('admin');
    const site = await createSite();
    const item = await createItem();
    const emp = await createEmployee({ site_id: site.id });
    await createIssue(emp.id, item.id, site.id, '2026-01-10');

    const res = await fetchExport(admin, `${exportBase}/employee-card/${emp.id}/sheets`, { year: 2026 });
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('zip');
  });

  it('group-prints sheets for every employee with an issue on the date', async () => {
    const admin = await loginAs('admin');
    const site = await createSite();
    const item = await createItem();
    await createEmployee({ site_id: site.id, position: 'Оператор', full_name: 'Оператор Один' });
    await createEmployee({ site_id: site.id, position: 'Водитель', full_name: 'Водитель Два' });

    const batch = await request(app)
      .post('/api/issues/batch')
      .set(authHeaders('admin', 1))
      .send({ site_id: site.id, item_type_id: item.id, quantity: 1, issue_date: '2026-05-14' });
    expect(batch.status).toBe(201);
    expect(batch.body.records.length).toBe(2);

    const res = await fetchExport(admin, `${exportBase}/issue-sheets`, { issue_date: '2026-05-14' });
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('zip');

    const AdapterZip = (await import('adm-zip')).default;
    const names = new AdapterZip(res.body).getEntries().map((e) => e.entryName);
    expect(names.length).toBe(2);
    expect(names.some((n) => n.includes('Оператор Один'))).toBe(true);
    expect(names.some((n) => n.includes('Водитель Два'))).toBe(true);

    // Фильтр по должности: только операторы
    const filtered = await fetchExport(admin, `${exportBase}/issue-sheets`, {
      issue_date: '2026-05-14',
      position: 'Оператор',
    });
    expect(filtered.status).toBe(200);
    const filteredNames = new AdapterZip(filtered.body).getEntries().map((e) => e.entryName);
    expect(filteredNames.length).toBe(1);
    expect(filteredNames[0]).toContain('Оператор Один');
  });

  it('creates a batch issue only for the requested position', async () => {
    const admin = await loginAs('admin');
    const site = await createSite();
    const item = await createItem();
    await createEmployee({ site_id: site.id, position: 'Оператор' });
    await createEmployee({ site_id: site.id, position: 'Водитель' });

    const res = await request(app)
      .post('/api/issues/batch')
      .set(authHeaders('admin', 1))
      .send({ site_id: site.id, item_type_id: item.id, quantity: 1, issue_date: '2026-05-15', position: 'Оператор' });
    expect(res.status).toBe(201);
    expect(res.body.records.length).toBe(1);

    const unknown = await request(app)
      .post('/api/issues/batch')
      .set(authHeaders('admin', 1))
      .send({ site_id: site.id, item_type_id: item.id, quantity: 1, issue_date: '2026-05-15', position: 'Бухгалтер' });
    expect(unknown.status).toBe(404);
  });

  it('falls back to the latest issue date for group printing', async () => {
    const admin = await loginAs('admin');
    const site = await createSite();
    const item = await createItem();
    const emp = await createEmployee({ site_id: site.id, position: 'Оператор', full_name: 'Последний Сотрудник' });
    await createIssue(emp.id, item.id, site.id, '2026-06-01');

    const res = await fetchExport(admin, `${exportBase}/issue-sheets`);
    expect(res.status).toBe(200);
    const AdapterZip = (await import('adm-zip')).default;
    const names = new AdapterZip(res.body).getEntries().map((e) => e.entryName);
    expect(names.some((n) => n.includes('Последний Сотрудник'))).toBe(true);
  });
});
