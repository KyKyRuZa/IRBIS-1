import pool from './db.js';

function badRequest(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

export async function createIssueRecord(employeeId, itemTypeId, quantity, issueDate, expiryDate, certificateId, reorderDate, wearTimeOverride) {
  const result = await pool.query(
    `INSERT INTO issue_records (employee_id, item_type_id, quantity, issue_date, expiry_date, certificate_id, reorder_date, wear_time_override_months) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [employeeId, itemTypeId, quantity, issueDate, expiryDate, certificateId, reorderDate, wearTimeOverride]
  );
  return result.rows[0];
}

export async function getAllIssueRecords() {
  const result = await pool.query(`
    SELECT r.*, e.full_name, e.position, e.site_id, it.name as item_type_name, it.category, c.certificate_number
    FROM issue_records r
    JOIN employees e ON r.employee_id = e.id
    JOIN item_types it ON r.item_type_id = it.id
    LEFT JOIN certificates c ON r.certificate_id = c.id
    ORDER BY r.issue_date DESC
  `);
  return result.rows;
}

export async function getIssueRecordsByEmployee(employeeId) {
  const result = await pool.query(`
    SELECT r.*, it.name as item_type_name, it.category, c.certificate_number
    FROM issue_records r
    JOIN item_types it ON r.item_type_id = it.id
    LEFT JOIN certificates c ON r.certificate_id = c.id
    WHERE r.employee_id = $1
    ORDER BY r.issue_date DESC
  `, [employeeId]);
  return result.rows;
}

export async function getIssueRecordsBySite(siteId) {
  const result = await pool.query(`
    SELECT r.*, e.full_name, e.position, it.name as item_type_name, it.category
    FROM issue_records r
    JOIN employees e ON r.employee_id = e.id
    JOIN item_types it ON r.item_type_id = it.id
    WHERE e.site_id = $1
    ORDER BY r.issue_date DESC
  `, [siteId]);
  return result.rows;
}

export async function disposeIssueRecord(id) {
  const result = await pool.query(
    "UPDATE issue_records SET status='disposed' WHERE id=$1 RETURNING *",
    [id]
  );
  return result.rows[0];
}

export async function returnIssueRecord(id, returnDate, returnQuantity) {
  const result = await pool.query(
    "UPDATE issue_records SET status='returned', return_date=$1, return_quantity=$2 WHERE id=$3 RETURNING *",
    [returnDate, returnQuantity, id]
  );
  return result.rows[0];
}

export async function batchIssueRecords(records) {
  const result = await pool.query(
    `INSERT INTO issue_records (employee_id, item_type_id, quantity, issue_date, expiry_date, certificate_id, reorder_date, wear_time_override_months, notes)
     SELECT * FROM UNNEST($1::int[], $2::int[], $3::int[], $4::date[], $5::date[], $6::int[], $7::date[], $8::int[], $9::text[]) RETURNING *`,
    [
      records.map(r => r.employee_id),
      records.map(r => r.item_type_id),
      records.map(r => r.quantity),
      records.map(r => r.issue_date),
      records.map(r => r.expiry_date),
      records.map(r => r.certificate_id),
      records.map(r => r.reorder_date),
      records.map(r => r.wear_time_override),
      records.map(r => r.notes || null)
    ]
  );
  return result.rows;
}

export async function getExpiringItems(monthsAhead = 2) {
  const result = await pool.query(`
    SELECT r.*, e.full_name, it.name as item_type_name, it.category
    FROM issue_records r
    JOIN employees e ON r.employee_id = e.id
    JOIN item_types it ON r.item_type_id = it.id
    WHERE r.expiry_date <= NOW() + make_interval(months => $1)
      AND r.status = 'issued'
    ORDER BY r.expiry_date
  `, [monthsAhead]);
  return result.rows;
}

export async function getIssueRecordById(id) {
  const result = await pool.query(`
    SELECT r.*, e.full_name, e.position, e.site_id, it.name as item_type_name, it.category, c.certificate_number
    FROM issue_records r
    JOIN employees e ON r.employee_id = e.id
    JOIN item_types it ON r.item_type_id = it.id
    LEFT JOIN certificates c ON r.certificate_id = c.id
    WHERE r.id = $1
  `, [id]);
  return result.rows[0];
}

export async function updateIssueRecord(id, data) {
  const current = (await getIssueRecordById(id));
  if (!current) return null;

  const patch = {};
  const whitelist = ['employee_id', 'item_type_id', 'quantity', 'issue_date', 'expiry_date', 'certificate_id', 'notes', 'status'];
  for (const key of whitelist) {
    if (Object.prototype.hasOwnProperty.call(data, key)) patch[key] = data[key];
  }
  // The API sends `wear_time_override`; the column is `wear_time_override_months`.
  if (Object.prototype.hasOwnProperty.call(data, 'wear_time_override')) {
    patch.wear_time_override_months = data.wear_time_override;
  }

  if (Object.prototype.hasOwnProperty.call(patch, 'employee_id')) {
    if (patch.employee_id === '' || patch.employee_id == null) throw badRequest('employee_id is required');
    const emp = await pool.query('SELECT id FROM employees WHERE id=$1', [patch.employee_id]);
    if (!emp.rows[0]) throw badRequest('Employee not found');
  }
  if (Object.prototype.hasOwnProperty.call(patch, 'item_type_id')) {
    const item = await pool.query('SELECT * FROM item_types WHERE id=$1', [patch.item_type_id]);
    if (!item.rows[0]) throw badRequest('Item type not found');
  }
  if (Object.prototype.hasOwnProperty.call(patch, 'quantity')) {
    const parsed = Number(patch.quantity);
    if (!Number.isInteger(parsed) || parsed <= 0) throw badRequest('quantity must be a positive integer');
    patch.quantity = parsed;
  }

  const itemTypeId = patch.item_type_id ?? current.item_type_id;
  const wearTime = patch.wear_time_override_months ?? current.wear_time_override_months;
  if (wearTime !== null && wearTime !== undefined) {
    const parsedWear = Number(wearTime);
    if (!Number.isFinite(parsedWear)) throw badRequest('wear_time_override must be a number');
    patch.wear_time_override_months = parsedWear;
  }

  if (Object.prototype.hasOwnProperty.call(patch, 'item_type_id') || Object.prototype.hasOwnProperty.call(patch, 'wear_time_override_months')) {
    const item = await pool.query('SELECT * FROM item_types WHERE id=$1', [itemTypeId]);
    const effectiveWear = wearTime ? Number(wearTime) : (item.rows[0]?.default_wear_time_months || null);
    const issueDate = patch.issue_date ?? current.issue_date;
    let expiryDate = null;
    if (effectiveWear && issueDate) {
      expiryDate = new Date(issueDate);
      expiryDate.setMonth(expiryDate.getMonth() + effectiveWear);
    }
    patch.expiry_date = expiryDate ? expiryDate.toISOString().split('T')[0] : null;
    patch.reorder_date = expiryDate ? new Date(new Date(expiryDate).setMonth(new Date(expiryDate).getMonth() - 2)).toISOString().split('T')[0] : null;
  }

  const columns = Object.keys(patch);
  if (columns.length === 0) return current;

  const assignments = columns.map((c, i) => `${c}=$${i + 1}`);
  const values = columns.map((c) => patch[c]);

  const result = await pool.query(
    `UPDATE issue_records SET ${assignments.join(', ')} WHERE id=$${values.length + 1} RETURNING *`,
    [...values, id]
  );
  return result.rows[0];
}

export async function deleteIssueRecord(id) {
  const result = await pool.query('DELETE FROM issue_records WHERE id=$1 RETURNING *', [id]);
  return result.rows[0];
}