import pool from './db.js';

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
  const { employee_id, item_type_id, quantity, issue_date, expiry_date, certificate_id, reorder_date, wear_time_override_months, notes, status } = data;
  const result = await pool.query(
    `UPDATE issue_records SET employee_id=$1, item_type_id=$2, quantity=$3, issue_date=$4, expiry_date=$5, certificate_id=$6, reorder_date=$7, wear_time_override_months=$8, notes=$9, status=$10 WHERE id=$11 RETURNING *`,
    [employee_id, item_type_id, quantity, issue_date, expiry_date, certificate_id, reorder_date, wear_time_override_months, notes, status, id]
  );
  return result.rows[0];
}

export async function deleteIssueRecord(id) {
  const result = await pool.query('DELETE FROM issue_records WHERE id=$1 RETURNING *', [id]);
  return result.rows[0];
}