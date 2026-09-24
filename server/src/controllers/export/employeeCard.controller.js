import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../../models/db.js';
import { logger } from '../../utils/logger.js';
import { buildCardData, renderTemplate } from './employeeCardHelpers.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function exportEmployeeCard(req, res, next) {
  try {
    const result = await pool.query(`
      SELECT e.*, s.name as site_name, s.responsible_person as site_responsible
      FROM employees e
      LEFT JOIN sites s ON e.site_id = s.id
      WHERE e.id = $1
    `, [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Employee not found' });

    const emp = result.rows[0];
    const data = await buildCardData(emp);

    const templatePath = path.join(__dirname, '..', '..', 'templates', 'card-template.docx');
    const buffer = await renderTemplate(templatePath, data);

    const filename = `Карточка_СИЗ_${emp.full_name}_${emp.personnel_number || emp.id}.docx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
    res.send(buffer);
  } catch (error) {
    logger.error(error, 'exportEmployeeCard error');
    next(error);
  }
}
