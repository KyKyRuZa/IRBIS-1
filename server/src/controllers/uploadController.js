import pool from '../models/db.js'
import path from 'path'
import { childLogger } from '../utils/logger.js'
import { validateUploadedFileType, cleanupUploadedFile, cleanupOldFilePath } from '../middleware/upload.js'

const log = childLogger('upload')

export async function uploadCertificate(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Файл обязателен' })
    }
    try {
      await validateUploadedFileType(req.file)
    } catch (err) {
      return res.status(400).json({ error: err.message || 'Недопустимый тип файла' })
    }
    const {
      product_name,
      certificate_number,
      issue_date,
      expiry_date,
      item_type_id,
      certificate_id,
    } = req.body
    if (!product_name) {
      return res.status(400).json({ error: 'Введите наименование продукции' })
    }
    const relativePath = path.join('/uploads', 'certificates', req.file.filename)
    let result
    if (certificate_id) {
      const existing = await pool.query('SELECT file_path FROM certificates WHERE id=$1', [
        certificate_id,
      ])
      if (!existing.rows[0]) {
        await cleanupUploadedFile(req.file)
        return res.status(404).json({ error: 'Сертификат не найден' })
      }
      const oldPath = existing.rows[0].file_path
      result = await pool.query(
        'UPDATE certificates SET product_name=$1, certificate_number=$2, issue_date=$3, expiry_date=$4, file_path=$5, item_type_id=$6 WHERE id=$7 RETURNING *',
        [
          product_name,
          certificate_number || null,
          issue_date || null,
          expiry_date || null,
          relativePath,
          item_type_id || null,
          certificate_id,
        ]
      )
      await cleanupOldFilePath(oldPath)
    } else {
      result = await pool.query(
        'INSERT INTO certificates (product_name, certificate_number, issue_date, expiry_date, file_path, item_type_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [
          product_name,
          certificate_number || null,
          issue_date || null,
          expiry_date || null,
          relativePath,
          item_type_id || null,
        ]
      )
    }
    res.status(certificate_id ? 200 : 201).json(result.rows[0])
    log.info(
      { certificateNumber: certificate_number, certificateId: certificate_id },
      'Certificate file uploaded'
    )
  } catch (error) {
    log.error(error)
    await cleanupUploadedFile(req.file)
    next(error)
  }
}

export async function uploadSignature(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Файл обязателен' })
    }
    try {
      await validateUploadedFileType(req.file)
    } catch (err) {
      return res.status(400).json({ error: err.message || 'Недопустимый тип файла' })
    }
    const { issue_record_id } = req.body
    if (!issue_record_id) {
      await cleanupUploadedFile(req.file)
      return res.status(400).json({ error: 'Укажите запись выдачи' })
    }
    const recordResult = await pool.query('SELECT employee_id, signature_path FROM issue_records WHERE id=$1', [
      issue_record_id,
    ])
    const record = recordResult.rows[0]
    if (!record) {
      await cleanupUploadedFile(req.file)
      return res.status(404).json({ error: 'Запись выдачи не найдена' })
    }
    const isAdmin = req.user?.role === 'admin'
    if (!isAdmin) {
      const empResult = await pool.query('SELECT id FROM employees WHERE user_id=$1', [req.user.id])
      const employeeId = empResult.rows[0]?.id
      if (!employeeId || record.employee_id !== employeeId) {
        await cleanupUploadedFile(req.file)
        return res.status(403).json({ error: 'Доступ запрещён' })
      }
    }
    const relativePath = path.join('/uploads', 'signatures', req.file.filename)
    const oldSignaturePath = record.signature_path
    const result = await pool.query(
      'UPDATE issue_records SET signature_path=$1, signature_date=$2 WHERE id=$3 RETURNING *',
      [relativePath, new Date().toISOString().split('T')[0], issue_record_id]
    )
    if (oldSignaturePath) {
      await cleanupOldFilePath(oldSignaturePath)
    }
    res.json(result.rows[0])
    log.info(
      { issueRecordId: issue_record_id, employeeId: record.employee_id, byAdmin: isAdmin },
      'Signature uploaded'
    )
  } catch (error) {
    log.error(error)
    await cleanupUploadedFile(req.file)
    next(error)
  }
}
