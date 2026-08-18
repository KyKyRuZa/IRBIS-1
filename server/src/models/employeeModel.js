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

export async function createEmployee(fullName, position, siteId, gender, hireDate, clothingSize, shoeSize, height, personnelNumber, hatSize, respiratorSize, glovesSize, positionChangeDate) {
  const sanitize = (v) => (v === '' || v === undefined || v === null) ? null : v;
  const result = await pool.query(
    `INSERT INTO employees (full_name, position, site_id, gender, hire_date, clothing_size, shoe_size, height, personnel_number, hat_size, respirator_size, gloves_size, position_change_date) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
    [
      fullName, position,
      sanitize(siteId) && Number(siteId) ? Number(siteId) : null,
      sanitize(gender),
      sanitize(hireDate),
      sanitize(clothingSize),
      sanitize(shoeSize),
      sanitize(height) && Number(height) ? Number(height) : null,
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

export async function updateEmployee(id, data) {
  const sanitize = (v) => (v === '' || v === undefined || v === null) ? null : v;
  const {
    full_name, position, site_id, gender, hire_date,
    clothing_size, shoe_size, height, status, personnel_number,
    hat_size, respirator_size, gloves_size, position_change_date
  } = data;
  const result = await pool.query(
    `UPDATE employees SET full_name=$1, position=$2, site_id=$3, gender=$4, hire_date=$5, 
     clothing_size=$6, shoe_size=$7, height=$8, status=$9, personnel_number=$10, hat_size=$11, respirator_size=$12, gloves_size=$13, position_change_date=$14 
     WHERE id=$15 RETURNING *`,
    [
      sanitize(full_name), sanitize(position),
      sanitize(site_id) && site_id !== '' ? Number(site_id) : null,
      sanitize(gender), sanitize(hire_date),
      sanitize(clothing_size), sanitize(shoe_size),
      sanitize(height) && height !== '' ? Number(height) : null,
      sanitize(status), sanitize(personnel_number),
      sanitize(hat_size), sanitize(respirator_size), sanitize(gloves_size),
      sanitize(position_change_date), id
    ]
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

export async function getSiteById(id) {
  const result = await pool.query('SELECT * FROM sites WHERE id = $1', [id]);
  return result.rows[0];
}

export async function updateSite(id, data) {
  const { name, responsible_person } = data;
  const result = await pool.query(
    'UPDATE sites SET name=$1, responsible_person=$2 WHERE id=$3 RETURNING *',
    [name, responsible_person, id]
  );
  return result.rows[0];
}

export async function deleteSite(id) {
  const result = await pool.query('DELETE FROM sites WHERE id=$1 RETURNING *', [id]);
  return result.rows[0];
}