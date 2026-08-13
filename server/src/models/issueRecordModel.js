import pool from './db.js';

export async function createIssueRecord(employeeId, itemTypeId, quantity, issueDate, expiryDate, certificateId) {
  const result = await pool.query(
    `INSERT INTO issue_records (employee_id, item_type_id, quantity, issue_date, expiry_date, certificate_id) 
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [employeeId, itemTypeId, quantity, issueDate, expiryDate, certificateId]
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