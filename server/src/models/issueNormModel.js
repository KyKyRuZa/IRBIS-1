import pool from './db.js';

/** Columns of `issue_norms` that may be written through the API. */
const NORM_COLUMNS = [
  'item_type_id',
  'period_months',
  'quantity',
  'gender',
  'position',
  'site_id',
  'seasonality',
  'etn_point',
  'period_text',
];

/** Integer columns — empty strings must become NULL, never be sent to Postgres. */
const INTEGER_COLUMNS = new Set(['item_type_id', 'period_months', 'quantity', 'site_id']);

/** Columns that Postgres declares NOT NULL. */
const REQUIRED_COLUMNS = new Set(['period_months']);

function badRequest(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

function isBlank(value) {
  return value === undefined || value === null || (typeof value === 'string' && value.trim() === '');
}

/**
 * Converts a raw request value into something Postgres accepts for `column`.
 * Empty strings coming from HTML form controls are treated as "no value" (NULL)
 * instead of being passed straight into integer columns, which used to fail with
 * `invalid input syntax for type integer: ""` (HTTP 500).
 */
function normalizeValue(column, value) {
  if (isBlank(value)) {
    if (REQUIRED_COLUMNS.has(column)) throw badRequest(`${column} is required`);
    return null;
  }

  if (INTEGER_COLUMNS.has(column)) {
    const parsed = Number(value);
    if (!Number.isInteger(parsed)) throw badRequest(`${column} must be an integer`);
    return parsed;
  }

  return typeof value === 'string' ? value.trim() : value;
}

/**
 * Picks the writable columns present in `data` and normalizes their values.
 * With `skipBlank`, blank optional values are left out entirely so column
 * defaults (e.g. `quantity = 1`) still apply on INSERT.
 */
function collectFields(data, { skipBlank = false } = {}) {
  const source = data && typeof data === 'object' ? data : {};
  const fields = [];

  for (const column of NORM_COLUMNS) {
    if (!Object.prototype.hasOwnProperty.call(source, column)) continue;
    if (skipBlank && isBlank(source[column]) && !REQUIRED_COLUMNS.has(column)) continue;
    fields.push([column, normalizeValue(column, source[column])]);
  }

  return fields;
}

export function normalizeNormId(id) {
  const parsed = Number(id);
  if (!Number.isInteger(parsed) || parsed <= 0) throw badRequest('Invalid norm id');
  return parsed;
}

export async function createIssueNorm(data) {
  const fields = collectFields(data, { skipBlank: true });
  if (!fields.some(([column]) => column === 'period_months')) {
    throw badRequest('period_months is required');
  }

  const columns = fields.map(([column]) => column);
  const placeholders = fields.map((_, index) => `$${index + 1}`);
  const values = fields.map(([, value]) => value);

  const result = await pool.query(
    `INSERT INTO issue_norms (${columns.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`,
    values
  );
  return result.rows[0];
}

export async function getAllIssueNorms() {
  const result = await pool.query(`
    SELECT n.*, it.name as item_type_name, s.name as site_name
    FROM issue_norms n
    LEFT JOIN item_types it ON n.item_type_id = it.id
    LEFT JOIN sites s ON n.site_id = s.id
    ORDER BY it.name
  `);
  return result.rows;
}

export async function getNormsForEmployee(employee) {
  const result = await pool.query(`
    SELECT n.*, it.name as item_type_name, it.category
    FROM issue_norms n
    JOIN item_types it ON n.item_type_id = it.id
    WHERE (n.gender IS NULL OR n.gender = $1)
      AND (n.position IS NULL OR n.position = $2)
      AND (n.site_id IS NULL OR n.site_id = $3)
  `, [employee.gender, employee.position, employee.site_id]);
  return result.rows;
}

export async function getNormById(id) {
  const result = await pool.query(`
    SELECT n.*, it.name as item_type_name
    FROM issue_norms n
    LEFT JOIN item_types it ON n.item_type_id = it.id
    WHERE n.id = $1
  `, [normalizeNormId(id)]);
  return result.rows[0];
}

export async function updateIssueNorm(id, data) {
  const normId = normalizeNormId(id);
  // Partial update: fields absent from the payload keep their stored value,
  // so editing the basic fields no longer wipes seasonality/etn_point/period_text.
  const fields = collectFields(data);
  if (fields.length === 0) return getNormById(normId);

  const assignments = fields.map(([column], index) => `${column}=$${index + 1}`);
  const values = fields.map(([, value]) => value);

  const result = await pool.query(
    `UPDATE issue_norms SET ${assignments.join(', ')} WHERE id=$${values.length + 1} RETURNING *`,
    [...values, normId]
  );
  return result.rows[0];
}

export async function deleteIssueNorm(id) {
  const result = await pool.query('DELETE FROM issue_norms WHERE id=$1 RETURNING *', [normalizeNormId(id)]);
  return result.rows[0];
}
