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
  const { product_name, certificate_number, issue_date, expiry_date, file_path, item_type_id } = data;
  const result = await pool.query(
    'UPDATE certificates SET product_name=$1, certificate_number=$2, issue_date=$3, expiry_date=$4, file_path=$5, item_type_id=$6 WHERE id=$7 RETURNING *',
    [product_name, certificate_number, issue_date, expiry_date, file_path, item_type_id, id]
  );
  return result.rows[0];
}

export async function deleteCertificate(id) {
  const result = await pool.query('DELETE FROM certificates WHERE id=$1 RETURNING *', [id]);
  return result.rows[0];
}