import pool from './db.js';

export async function createSite(name, responsiblePerson) {
  const result = await pool.query(
    'INSERT INTO sites (name, responsible_person) VALUES ($1, $2) RETURNING *',
    [name, responsiblePerson]
  );
  return result.rows[0];
}

export async function getAllSites() {
  const result = await pool.query('SELECT * FROM sites ORDER BY name');
  return result.rows;
}

export async function getSiteById(id) {
  const result = await pool.query('SELECT * FROM sites WHERE id = $1', [id]);
  return result.rows[0];
}

export async function updateSite(id, data) {
  const fields = {
    name: data.name,
    responsible_person: data.responsible_person,
  };
  const entries = Object.entries(fields).filter(([, v]) => v !== undefined);
  if (entries.length === 0) {
    const r = await pool.query('SELECT * FROM sites WHERE id=$1', [id]);
    return r.rows[0];
  }
  const assignments = entries.map(([col], i) => `"${col}"=$${i + 1}`);
  const values = entries.map(([, v]) => v);
  const result = await pool.query(
    `UPDATE sites SET ${assignments.join(', ')} WHERE id=$${entries.length + 1} RETURNING *`,
    [...values, id]
  );
  return result.rows[0];
}

export async function deleteSite(id) {
  const result = await pool.query('DELETE FROM sites WHERE id=$1 RETURNING *', [id]);
  return result.rows[0];
}
