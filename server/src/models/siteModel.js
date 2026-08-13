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