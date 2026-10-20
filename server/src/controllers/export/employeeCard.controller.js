import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../../models/db.js';
import { logger } from '../../utils/logger.js';
import { getNormsForEmployee } from '../../models/issueNormModel.js';
import {
  getIssueRecordsForEvent,
  getIssueEventsByEmployee,
  getIssueSheetNumber,
} from '../../models/issueRecordModel.js';
import { buildTitleData, buildSheetData, renderTemplate } from './employeeCardHelpers.js';
import { ZipArchive } from 'archiver';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const TITLE_TEMPLATE = path.join(__dirname, '..', '..', 'templates', 'card-title-template.docx');
const SHEET_TEMPLATE = path.join(__dirname, '..', '..', 'templates', 'card-sheet-template.docx');

async function findEmployee(id) {
  const result = await pool.query(`
    SELECT e.*, s.name as site_name, s.responsible_person as site_responsible
    FROM employees e
    LEFT JOIN sites s ON e.site_id = s.id
    WHERE e.id = $1
  `, [id]);
  return result.rows[0] || null;
}

function sendDocx(res, buffer, filename) {
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
  res.send(buffer);
}

/**
 * Личная карточка СИЗ, разделённая на печатные формы:
 *   part=title (по умолчанию) — титульный лист, печатается один раз;
 *   part=sheet&issue_date=YYYY-MM-DD — лист конкретной выдачи (только её позиции).
 */
export async function exportEmployeeCard(req, res, next) {
  try {
    console.log('DEBUG exportEmployeeCard: query=', JSON.stringify(req.query), 'params=', req.params);
    const emp = await findEmployee(req.params.id);
    if (!emp) return res.status(404).json({ error: 'Employee not found' });

    if (req.query.part === 'sheet') {
      const issueDate = (req.query.issue_date || '').trim();
      if (!issueDate) {
        return res.status(400).json({ error: 'issue_date is required for part=sheet' });
      }
      const [items, sheetNumber] = await Promise.all([
        getIssueRecordsForEvent(emp.id, issueDate),
        getIssueSheetNumber(emp.id, issueDate),
      ]);
      console.log('DEBUG sheet: items.length=', items.length, 'sheetNumber=', sheetNumber, 'items=', items.map(i => ({date: i.issue_date, item: i.item_type_name, qty: i.quantity})));
      if (items.length === 0) return res.status(404).json({ error: 'No issues found for this date' });

      const data = buildSheetData(emp, items, sheetNumber, new Date(issueDate).getFullYear());
      const buffer = await renderTemplate(SHEET_TEMPLATE, data);
      return sendDocx(res, buffer, `Лист_выдачи_${emp.full_name}_${issueDate}.docx`);
    }

    const norms = await getNormsForEmployee(emp);
    const data = await buildTitleData(emp, norms);
    const buffer = await renderTemplate(TITLE_TEMPLATE, data);
    return sendDocx(res, buffer, `Титульный_лист_СИЗ_${emp.full_name}_${emp.personnel_number || emp.id}.docx`);
  } catch (error) {
    logger.error(error, 'exportEmployeeCard error');
    next(error);
  }
}

/** Все листы выдачи сотрудника за год одним архивом. */
export async function exportEmployeeCardSheets(req, res, next) {
  try {
    const emp = await findEmployee(req.params.id);
    if (!emp) return res.status(404).json({ error: 'Employee not found' });

    const year = Number(req.query.year) || new Date().getFullYear();
    const events = await getIssueEventsByEmployee(emp.id, year);
    if (events.length === 0) {
      return res.status(404).json({ error: 'No issues found for this year' });
    }

    const archive = new ZipArchive();
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(`Листы_выдачи_${emp.full_name}_${year}.zip`)}`);
    archive.pipe(res);

    archive.on('error', (err) => {
      logger.error(err, 'Archive error');
      if (!res.headersSent) res.status(500).json({ error: 'Archive error' });
    });

    for (const event of events) {
      const buffer = await renderTemplate(SHEET_TEMPLATE, buildSheetData(emp, event.items, event.sheetNumber, year));
      archive.append(buffer, { name: `Лист_${event.sheetNumber}_${emp.full_name}_${event.issue_date}.docx` });
    }

    await archive.finalize();
  } catch (error) {
    logger.error(error, 'exportEmployeeCardSheets error');
    if (!res.headersSent) next(error);
  }
}
