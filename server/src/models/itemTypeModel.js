import pool from './db.js';

export async function createItemType(name, category, unit, defaultWearTimeMonths, seasonality, requiresCertificate) {
  const result = await pool.query(
    'INSERT INTO item_types (name, category, unit, default_wear_time_months, seasonality, requires_certificate) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
    [name, category, unit, defaultWearTimeMonths, seasonality, requiresCertificate]
  );
  return result.rows[0];
}

export async function getAllItemTypes() {
  const result = await pool.query('SELECT * FROM item_types ORDER BY category, name');
  return result.rows;
}

export async function getItemTypeById(id) {
  const result = await pool.query('SELECT * FROM item_types WHERE id = $1', [id]);
  return result.rows[0];
}

export async function updateItemType(id, data) {
  const fields = {
    name: data.name,
    category: data.category,
    unit: data.unit,
    default_wear_time_months: data.default_wear_time,
    seasonality: data.seasonality,
    requires_certificate: data.requires_certificate,
  };
  const entries = Object.entries(fields).filter(([, v]) => v !== undefined);
  if (entries.length === 0) {
    const r = await pool.query('SELECT * FROM item_types WHERE id=$1', [id]);
    return r.rows[0];
  }
  const assignments = entries.map(([col], i) => `"${col}"=$${i + 1}`);
  const values = entries.map(([, v]) => v);
  const result = await pool.query(
    `UPDATE item_types SET ${assignments.join(', ')} WHERE id=$${entries.length + 1} RETURNING *`,
    [...values, id]
  );
  return result.rows[0];
}

export async function getItemTypesByCertificate(filter) {
  let query = 'SELECT * FROM item_types';
  const params = [];
  
  if (filter) {
    query += ' WHERE requires_certificate = true';
  }
  query += ' ORDER BY name';
  const result = await pool.query(query, params);
  return result.rows;
}

export async function deleteItemType(id) {
  const result = await pool.query('DELETE FROM item_types WHERE id=$1 RETURNING *', [id]);
  return result.rows[0];
}
