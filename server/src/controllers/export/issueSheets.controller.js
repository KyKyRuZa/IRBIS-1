import { logger } from '../../utils/logger.js';
import {
  getIssueRecordsForEvent,
  getIssueSheetNumber,
  getEmployeesWithIssueOnDate,
  getLatestIssueDate,
} from '../../models/issueRecordModel.js';
import { buildSheetData, renderTemplate } from './employeeCardHelpers.js';
import { ZipArchive } from 'archiver';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SHEET_TEMPLATE = path.join(__dirname, '..', '..', 'templates', 'card-sheet-template.docx');

function parseFilters(query) {
  return {
    position: (query.position || '').trim() || null,
    siteId: query.site_id ? Number(query.site_id) : null,
  };
}

/**
 * Групповая печать листов выдачи: по одному листу на каждого сотрудника,
 * у которого есть выдача в указанную дату (по умолчанию — самая свежая).
 * Фильтры: должность (`position`) и объект (`site_id`).
 */
export async function exportIssueSheets(req, res, next) {
  try {
    const filters = parseFilters(req.query);
    let issueDate = (req.query.issue_date || '').trim();

    if (!issueDate) {
      issueDate = await getLatestIssueDate(filters);
      if (!issueDate) {
        return res.status(404).json({ error: 'No issue records match the filters' });
      }
    }

    const employees = await getEmployeesWithIssueOnDate(issueDate, filters);
    if (employees.length === 0) {
      return res.status(404).json({ error: 'No issues found for this date and filters' });
    }

    const archive = new ZipArchive();
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(`Листы_выдачи_${issueDate}.zip`)}`);
    archive.pipe(res);

    archive.on('error', (err) => {
      logger.error(err, 'Archive error');
      if (!res.headersSent) res.status(500).json({ error: 'Archive error' });
    });

    for (const emp of employees) {
      const [items, sheetNumber] = await Promise.all([
        getIssueRecordsForEvent(emp.id, issueDate),
        getIssueSheetNumber(emp.id, issueDate),
      ]);
      if (items.length === 0) continue;
      const buffer = await renderTemplate(SHEET_TEMPLATE, buildSheetData(emp, items, sheetNumber, new Date(issueDate).getFullYear()));
      archive.append(buffer, { name: `Лист_${sheetNumber}_${emp.full_name}_${emp.personnel_number || emp.id}.docx` });
    }

    await archive.finalize();
  } catch (error) {
    logger.error(error, 'exportIssueSheets error');
    if (!res.headersSent) next(error);
  }
}
