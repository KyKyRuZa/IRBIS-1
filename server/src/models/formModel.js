import pool from './db.js';

export async function createForm(name, description) {
  const result = await pool.query(
    'INSERT INTO forms (name, description) VALUES ($1, $2) RETURNING *',
    [name, description]
  );
  return result.rows[0];
}

export async function getFormById(id) {
  const result = await pool.query('SELECT * FROM forms WHERE id = $1', [id]);
  return result.rows[0];
}

export async function updateForm(id, name, description) {
  const result = await pool.query(
    'UPDATE forms SET name = $1, description = $2 WHERE id = $3 RETURNING *',
    [name, description, id]
  );
  return result.rows[0];
}

export async function deleteForm(id) {
  const result = await pool.query('DELETE FROM forms WHERE id = $1 RETURNING id', [id]);
  return result.rows[0] || null;
}

export async function getAllForms() {
  const result = await pool.query('SELECT * FROM forms ORDER BY id');
  return result.rows;
}

export async function recordFormTaken(employeeId, formId) {
  const result = await pool.query(
    `INSERT INTO form_taken (employee_id, form_id) 
     VALUES ($1, $2) 
     ON CONFLICT (employee_id, form_id) DO NOTHING RETURNING *`,
    [employeeId, formId]
  );
  return result.rows[0] || null;
}

export async function getFormTakenRecords() {
  const result = await pool.query(`
    SELECT ft.id, ft.taken_at, e.full_name, e.position, f.name as form_name
    FROM form_taken ft
    JOIN employees e ON ft.employee_id = e.id
    JOIN forms f ON ft.form_id = f.id
    ORDER BY ft.taken_at DESC
  `);
  return result.rows;
}

export async function getFormTakenByEmployee(employeeId) {
  const result = await pool.query(`
    SELECT f.id, f.name, f.description, ft.taken_at
    FROM form_taken ft
    JOIN forms f ON ft.form_id = f.id
    WHERE ft.employee_id = $1
    ORDER BY ft.taken_at DESC
  `, [employeeId]);
  return result.rows;
}