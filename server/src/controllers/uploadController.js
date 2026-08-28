import pool from '../models/db.js';
import path from 'path';
import { childLogger } from '../utils/logger.js';

const log = childLogger('upload');

export async function uploadCertificate(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'File is required' });
    }
    const { product_name, certificate_number, issue_date, expiry_date, item_type_id } = req.body;
    if (!product_name) {
      return res.status(400).json({ error: 'product_name is required' });
    }
    const relativePath = path.join('/uploads', 'certificates', req.file.filename);
    const result = await pool.query(
      'INSERT INTO certificates (product_name, certificate_number, issue_date, expiry_date, file_path, item_type_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [product_name, certificate_number || null, issue_date || null, expiry_date || null, relativePath, item_type_id || null]
    );
    res.status(201).json(result.rows[0]);
    log.info({ certificateNumber: certificate_number }, 'Certificate file uploaded');
  } catch (error) {
    log.error(error);
    next(error);
  }
}

export async function uploadSignature(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'File is required' });
    }
    const { issue_record_id } = req.body;
    if (!issue_record_id) {
      return res.status(400).json({ error: 'issue_record_id is required' });
    }
    const recordResult = await pool.query('SELECT employee_id FROM issue_records WHERE id=$1', [issue_record_id]);
    const record = recordResult.rows[0];
    if (!record) {
      return res.status(404).json({ error: 'Issue record not found' });
    }
    const isAdmin = req.user?.role === 'admin';
    if (!isAdmin) {
      const empResult = await pool.query('SELECT id FROM employees WHERE user_id=$1', [req.user.id]);
      const employeeId = empResult.rows[0]?.id;
      if (!employeeId || record.employee_id !== employeeId) {
        return res.status(403).json({ error: 'Forbidden' });
      }
    }
    const relativePath = path.join('/uploads', 'signatures', req.file.filename);
    await pool.query('UPDATE issue_records SET signature_path=$1, signature_date=$2 WHERE id=$3', [relativePath, new Date().toISOString().split('T')[0], issue_record_id]);
    const result = await pool.query('SELECT * FROM issue_records WHERE id=$1', [issue_record_id]);
    res.json(result.rows[0]);
    log.info({ issueRecordId: issue_record_id, employeeId: record.employee_id, byAdmin: isAdmin }, 'Signature uploaded');
  } catch (error) {
    log.error(error);
    next(error);
  }
}
