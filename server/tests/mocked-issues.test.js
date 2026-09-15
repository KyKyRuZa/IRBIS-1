import { describe, it, expect, vi, beforeEach } from 'vitest';

const records = [];
let nextId = 1;

function createMockRecord(overrides = {}) {
  const row = {
    id: nextId++,
    employee_id: 1,
    item_type_id: 1,
    quantity: 1,
    issue_date: '2025-01-01',
    expiry_date: '2025-07-01',
    certificate_id: null,
    reorder_date: '2024-11-01',
    wear_time_override_months: null,
    notes: null,
    issue_method: null,
    status: 'issued',
    return_date: null,
    return_quantity: null,
    signature_path: null,
    signature_date: null,
    write_off_act: null,
    ...overrides,
  };
  records.push(row);
  return row;
}

const mockQuery = vi.fn(async (text, params = []) => {
  const upper = text.trim().toUpperCase();

  if (upper.startsWith('INSERT INTO')) {
    const selectMatch = text.match(/INSERT INTO (\w+) [\s\S]* SELECT [\s\S]* FROM UNNEST\(/i);
    const simpleMatch = text.match(/INSERT INTO (\w+) \(([^)]+)\)\s*VALUES\s*\(([^)]+)\)\s*RETURNING \*$/i);
    if (selectMatch) {
      const table = selectMatch[1];
      const arrays = params.map(p => (Array.isArray(p) ? p : [p]));
      const maxLen = Math.max(...arrays.map(a => a.length));
      const rows = [];
      for (let i = 0; i < maxLen; i++) {
        const row = { id: nextId++ };
        row.employee_id = arrays[0][i];
        row.item_type_id = arrays[1][i];
        row.quantity = arrays[2][i];
        row.issue_date = arrays[3][i];
        row.expiry_date = arrays[4][i];
        row.certificate_id = arrays[5][i];
        row.reorder_date = arrays[6][i];
        row.wear_time_override_months = arrays[7][i];
        row.notes = arrays[8][i];
        row.issue_method = arrays[9][i];
        if (table === 'issue_records') records.push(row);
        rows.push(row);
      }
      return { rows, rowCount: rows.length };
    }
    if (simpleMatch) {
      const table = simpleMatch[1];
      const columns = simpleMatch[2].split(',').map(s => s.trim());
      const row = { id: nextId++ };
      columns.forEach((col, idx) => (row[col] = params[idx]));
      if (table === 'issue_records') records.push(row);
      return { rows: [row], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  if (upper.startsWith('SELECT')) {
    const fromMatch = text.match(/FROM (\w+)/i);
    const table = fromMatch ? fromMatch[1] : null;

    if (table === 'issue_records' && upper.includes('JOIN')) {
      return { rows: records.map(r => ({ ...r })), rowCount: records.length };
    }
    if (table === 'issue_records' && upper.includes('WHERE')) {
      const colMatch = text.match(/WHERE\s+\w+\.\w+\s*=\s*\$1/i) || text.match(/WHERE\s+\w+\s*=\s*\$1/i);
      if (colMatch) {
        const col = colMatch[0].match(/(\w+)\s*=\s*\$1/i)?.[1];
        const val = params[0];
        const filtered = records.filter(r => r[col] === val);
        return { rows: filtered.map(r => ({ ...r })), rowCount: filtered.length };
      }
    }
    if (table === 'issue_records') {
      return { rows: records.map(r => ({ ...r })), rowCount: records.length };
    }
    if (table === 'item_types' || table === 'employees' || table === 'sites') {
      return { rows: [], rowCount: 0 };
    }
  }

  if (upper.startsWith('UPDATE')) {
    const m = text.match(/UPDATE (\w+) SET (.+?) WHERE (.+?) RETURNING \*$/s);
    if (!m) return { rows: [], rowCount: 0 };
    const whereParamMatch = m[3].match(/\$(\d+)/);
    const idx = whereParamMatch ? Number(whereParamMatch[1]) - 1 : -1;
    const val = idx >= 0 ? params[idx] : null;
    const rowIdx = records.findIndex(r => r.id === val);
    if (rowIdx >= 0) {
      const row = records[rowIdx];
      const setParts = m[2].split(',').map(s => s.trim());
      for (const part of setParts) {
        const eqIdx = part.indexOf('=');
        if (eqIdx < 0) continue;
        const col = part.slice(0, eqIdx).trim();
        const valMatch = part.slice(eqIdx + 1).trim().match(/\$(\d+)/);
        if (valMatch) {
          const paramIdx = Number(valMatch[1]) - 1;
          row[col] = params[paramIdx];
        }
      }
      return { rows: [{ ...row }], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  if (upper.startsWith('DELETE')) {
    const m = text.match(/DELETE FROM (\w+) WHERE (.+?) RETURNING /);
    if (!m) return { rows: [], rowCount: 0 };
    const whereParamMatch = m[2].match(/\$1/);
    const id = whereParamMatch ? params[0] : null;
    const idx = records.findIndex(r => r.id === id);
    if (idx >= 0) {
      const [removed] = records.splice(idx, 1);
      return { rows: [{ ...removed }], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  return { rows: [], rowCount: 0 };
});

vi.mock('../src/models/db.js', () => {
  const pool = { query: mockQuery, end: vi.fn(async () => {}) };
  return { __esModule: true, default: pool, pool, prisma: {}, initDB: vi.fn(async () => {}) };
});

const { createIssueRecord, getAllIssueRecords, getIssueRecordsByEmployee, getIssueRecordsBySite, disposeIssueRecord, returnIssueRecord, batchIssueRecords, batchIssueRecordsForEmployee, getExpiringItems, getIssueRecordById, updateIssueRecord, deleteIssueRecord } = await import('../src/models/issueRecordModel.js');

describe('issueRecordModel (mocked db)', () => {
  beforeEach(() => {
    records.length = 0;
    nextId = 1;
    mockQuery.mockClear();
  });

  it('createIssueRecord stores issue_method', async () => {
    const row = await createIssueRecord(1, 1, 1, '2025-01-01', '2025-07-01', null, '2024-11-01', null, 'dosator');
    expect(row.issue_method).toBe('dosator');
  });

  it('batchIssueRecords stores issue_method per row', async () => {
    const rows = await batchIssueRecords([
      { employee_id: 1, item_type_id: 1, quantity: 1, issue_date: '2025-01-01', expiry_date: '2025-07-01', certificate_id: null, reorder_date: '2024-11-01', wear_time_override: null, notes: null, issue_method: 'personal' },
      { employee_id: 1, item_type_id: 2, quantity: 2, issue_date: '2025-01-01', expiry_date: '2025-07-01', certificate_id: null, reorder_date: '2024-11-01', wear_time_override: null, notes: null, issue_method: 'dosator' },
    ]);
    expect(rows[0].issue_method).toBe('personal');
    expect(rows[1].issue_method).toBe('dosator');
  });

  it('batchIssueRecordsForEmployee stores issue_method', async () => {
    const rows = await batchIssueRecordsForEmployee(1, [
      { item_type_id: 1, quantity: 1, expiry_date: '2025-07-01', certificate_id: null, reorder_date: '2024-11-01', wear_time_override: null, notes: null, issue_method: 'personal' },
    ], '2025-01-01');
    expect(rows[0].issue_method).toBe('personal');
  });

  it('updateIssueRecord updates issue_method', async () => {
    const created = await createIssueRecord(1, 1, 1, '2025-01-01', '2025-07-01', null, '2024-11-01', null, null);
    const updated = await updateIssueRecord(created.id, { issue_method: 'personal' });
    expect(updated.issue_method).toBe('personal');
  });

  it('deleteIssueRecord removes record', async () => {
    const created = await createIssueRecord(1, 1, 1, '2025-01-01', '2025-07-01', null, '2024-11-01', null, null);
    const deleted = await deleteIssueRecord(created.id);
    expect(deleted).not.toBeNull();
    expect(deleted.id).toBe(created.id);
  });
});
