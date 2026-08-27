import pool from './db.js';

export async function createCertificate(productName, certificateNumber, issueDate, expiryDate, filePath, itemTypeId) {
  const result = await pool.query(
    'INSERT INTO certificates (product_name, certificate_number, issue_date, expiry_date, file_path, item_type_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
    [productName, certificateNumber, issueDate, expiryDate, filePath, itemTypeId]
  );
  return result.rows[0];
}

export async function getAllCertificates() {
  const result = await pool.query(`
    SELECT c.*, it.name as item_type_name 
    FROM certificates c 
    LEFT JOIN item_types it ON c.item_type_id = it.id 
    ORDER BY c.expiry_date
  `);
  return result.rows;
}

export async function getCertificatesByItemTypeId(itemTypeId) {
  const result = await pool.query('SELECT * FROM certificates WHERE item_type_id = $1 ORDER BY expiry_date', [itemTypeId]);
  return result.rows;
}

export async function updateCertificateStatus() {
  const result = await pool.query(`
    UPDATE certificates SET status = CASE 
      WHEN expiry_date < NOW() THEN 'expired'
      WHEN expiry_date < NOW() + INTERVAL '30 days' THEN 'expiring'
      ELSE 'active'
    END
  `);
  return result.rowCount;
}

export async function getCertificateById(id) {
  const result = await pool.query('SELECT * FROM certificates WHERE id = $1', [id]);
  return result.rows[0];
}

export async function updateCertificate(id, data) {
  const fields = {
    product_name: data.product_name,
    certificate_number: data.certificate_number,
    issue_date: data.issue_date,
    expiry_date: data.expiry_date,
    file_path: data.file_path,
    item_type_id: data.item_type_id,
  };
  const entries = Object.entries(fields).filter(([, v]) => v !== undefined);
  if (entries.length === 0) {
    const r = await pool.query('SELECT * FROM certificates WHERE id=$1', [id]);
    return r.rows[0];
  }
  const assignments = entries.map(([col], i) => `"${col}"=$${i + 1}`);
  const values = entries.map(([, v]) => v);
  const result = await pool.query(
    `UPDATE certificates SET ${assignments.join(', ')} WHERE id=$${entries.length + 1} RETURNING *`,
    [...values, id]
  );
  return result.rows[0];
}

export async function deleteCertificate(id) {
  const result = await pool.query('DELETE FROM certificates WHERE id=$1 RETURNING *', [id]);
  return result.rows[0];
}