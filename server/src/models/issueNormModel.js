import pool from './db.js';

export async function createIssueNorm(itemTypeId, periodMonths, quantity, gender, position, siteId, seasonality, etnPoint, periodText) {
  const result = await pool.query(
    'INSERT INTO issue_norms (item_type_id, period_months, quantity, gender, position, site_id, seasonality, etn_point, period_text) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
    [itemTypeId, periodMonths, quantity, gender, position, siteId, seasonality, etnPoint, periodText]
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