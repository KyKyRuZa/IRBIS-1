import pool from './db.js';

export async function createEmployee(fullName, position, siteId, gender, hireDate, clothingSize, shoeSize, height, personnelNumber, hatSize, respiratorSize, glovesSize, positionChangeDate) {
  const sanitize = (v) => (v === '' || v === undefined || v === null) ? null : v;
  const result = await pool.query(
    `INSERT INTO employees (full_name, position, site_id, gender, hire_date, clothing_size, shoe_size, height, personnel_number, hat_size, respirator_size, gloves_size, position_change_date) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
     [
       fullName, position,
       sanitize(siteId) && siteId !== '' ? Number(siteId) : null,
       sanitize(gender),
       sanitize(hireDate),
       sanitize(clothingSize),
       sanitize(shoeSize),
       sanitize(height) && height !== '' ? Number(height) : null,
       sanitize(personnelNumber),
       sanitize(hatSize),
       sanitize(respiratorSize),
       sanitize(glovesSize),
       sanitize(positionChangeDate)
     ]
  );
  return result.rows[0];
}

export async function getAllEmployees() {
  const result = await pool.query(`
    SELECT e.*, s.name as site_name 
    FROM employees e 
    LEFT JOIN sites s ON e.site_id = s.id 
    ORDER BY e.created_at DESC
  `);
  return result.rows;
}

export async function getEmployeeById(id) {
  const result = await pool.query(`
    SELECT e.*, s.name as site_name 
    FROM employees e 
    LEFT JOIN sites s ON e.site_id = s.id 
    WHERE e.id = $1
  `, [id]);
  return result.rows[0];
}

export async function getEmployeesWithSizesBySite(siteId) {
  const result = await pool.query(`
    SELECT e.id, e.full_name, e.position, e.clothing_size, e.shoe_size, e.hat_size, e.respirator_size, e.gloves_size
    FROM employees e
    WHERE e.site_id = $1 AND e.status = 'active'
    ORDER BY e.full_name
  `, [siteId]);
  return result.rows;
}

export async function updateEmployee(id, data) {
  const sanitize = (v) => (v === '' || v === undefined || v === null) ? null : v;
  const map = {
    full_name: data.full_name !== undefined ? sanitize(data.full_name) : undefined,
    position: data.position !== undefined ? sanitize(data.position) : undefined,
    site_id: data.site_id !== undefined ? (sanitize(data.site_id) && data.site_id !== '' ? Number(data.site_id) : null) : undefined,
    gender: data.gender !== undefined ? sanitize(data.gender) : undefined,
    hire_date: data.hire_date !== undefined ? sanitize(data.hire_date) : undefined,
    clothing_size: data.clothing_size !== undefined ? sanitize(data.clothing_size) : undefined,
    shoe_size: data.shoe_size !== undefined ? sanitize(data.shoe_size) : undefined,
    height: data.height !== undefined ? (sanitize(data.height) && data.height !== '' ? Number(data.height) : null) : undefined,
    status: data.status !== undefined ? sanitize(data.status) : undefined,
    personnel_number: data.personnel_number !== undefined ? sanitize(data.personnel_number) : undefined,
    hat_size: data.hat_size !== undefined ? sanitize(data.hat_size) : undefined,
    respirator_size: data.respirator_size !== undefined ? sanitize(data.respirator_size) : undefined,
    gloves_size: data.gloves_size !== undefined ? sanitize(data.gloves_size) : undefined,
    position_change_date: data.position_change_date !== undefined ? sanitize(data.position_change_date) : undefined,
  };
  const entries = Object.entries(map).filter(([, v]) => v !== undefined);
  if (entries.length === 0) {
    const r = await pool.query(
      `SELECT e.*, s.name as site_name FROM employees e LEFT JOIN sites s ON e.site_id = s.id WHERE e.id=$1`,
      [id]
    );
    return r.rows[0];
  }
  const assignments = entries.map(([col], i) => `"${col}"=$${i + 1}`);
  const values = entries.map(([, v]) => v);
  const result = await pool.query(
    `UPDATE employees SET ${assignments.join(', ')} WHERE id=$${entries.length + 1} RETURNING *`,
    [...values, id]
  );
  return result.rows[0];
}

export async function terminateEmployee(id) {
  const result = await pool.query(
    "UPDATE employees SET status='terminated' WHERE id=$1 RETURNING *",
    [id]
  );
  return result.rows[0];
}

export async function deleteEmployee(id) {
  const result = await pool.query('DELETE FROM employees WHERE id=$1 RETURNING *', [id]);
  return result.rows[0];
}
