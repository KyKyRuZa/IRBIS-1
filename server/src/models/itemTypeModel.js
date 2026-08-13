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
  const { name, category, unit, default_wear_time_months, seasonality, requires_certificate } = data;
  const result = await pool.query(
    'UPDATE item_types SET name=$1, category=$2, unit=$3, default_wear_time_months=$4, seasonality=$5, requires_certificate=$6 WHERE id=$7 RETURNING *',
    [name, category, unit, default_wear_time_months, seasonality, requires_certificate, id]
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
