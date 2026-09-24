import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../../models/db.js';
import { logger } from '../../utils/logger.js';
import { buildCardData, matchNorms, renderTemplate } from './employeeCardHelpers.js';
import { ZipArchive } from 'archiver';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function exportAllCards(req, res, next) {
  try {
    const result = await pool.query(`
      SELECT e.*, s.name as site_name, s.responsible_person as site_responsible
      FROM employees e
      LEFT JOIN sites s ON e.site_id = s.id
      WHERE e.status = $1
    `, ['active']);
    const employees = result.rows;

    let allNorms = [];
    const historyByEmp = new Map();
    if (employees.length > 0) {
      const normsRes = await pool.query(`
        SELECT n.*, it.name as item_type_name, it.category
        FROM issue_norms n
        JOIN item_types it ON n.item_type_id = it.id
      `);
      allNorms = normsRes.rows;

      const histRes = await pool.query(`
        SELECT r.*, it.name as item_type_name, it.category, c.certificate_number
        FROM issue_records r
        JOIN item_types it ON r.item_type_id = it.id
        LEFT JOIN certificates c ON r.certificate_id = c.id
        WHERE r.employee_id = ANY($1::int[])
        ORDER BY r.employee_id, r.issue_date DESC
      `, [employees.map(e => e.id)]);
      for (const row of histRes.rows) {
        if (!historyByEmp.has(row.employee_id)) historyByEmp.set(row.employee_id, []);
        historyByEmp.get(row.employee_id).push(row);
      }
    }

    const archive = new ZipArchive();

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent('all_cards.zip')}`);
    archive.pipe(res);

    archive.on('error', (err) => {
      logger.error(err, 'Archive error');
      if (!res.headersSent) {
        res.status(500).json({ error: err.message });
      }
    });

    const templatePath = path.join(__dirname, '..', '..', 'templates', 'card-template.docx');

    for (const emp of employees) {
      const data = await buildCardData(emp, matchNorms(emp, allNorms), historyByEmp.get(emp.id) || []);

      const buffer = await renderTemplate(templatePath, data);
      if (!buffer || !Buffer.isBuffer(buffer)) {
        throw new Error('Template render returned invalid buffer');
      }
      archive.append(buffer, { name: `Карточка_СИЗ_${emp.full_name}_${emp.personnel_number || emp.id}.docx` });
    }

    await archive.finalize();
  } catch (error) {
    logger.error(error, 'exportAllCards error');
    if (!res.headersSent) {
      next(error);
    }
  }
}
