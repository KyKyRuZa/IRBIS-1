import pool from '../../models/db.js';
import { logger } from '../../utils/logger.js';
import { buildTable, emptyP, formatReportDate } from './docxTableHelpers.js';
import { Document, Packer, Paragraph, TextRun, AlignmentType } from 'docx';

export async function exportExpiringReport(req, res, next) {
  try {
    const months = parseInt(req.query.months) || 2;
    const result = await pool.query(`
      SELECT r.*, e.full_name as employee_name, e.position, e.personnel_number, s.name as site_name, it.name as item_name, it.category
      FROM issue_records r
      JOIN employees e ON r.employee_id = e.id
      JOIN item_types it ON r.item_type_id = it.id
      LEFT JOIN sites s ON e.site_id = s.id
      WHERE r.expiry_date <= NOW() + make_interval(months => $1)
      ORDER BY r.expiry_date ASC
    `, [months]);

    const rows = result.rows;
    const categories = { clothing: 'Спецодежда', footwear: 'Обувь', siz: 'СИЗ', consumable: 'Расходники' };

    const tableRows = [
      ['№', 'Сотрудник', 'Табельный №', 'Должность', 'Объект', 'Наименование СИЗ', 'Категория', 'Дата выдачи', 'Срок годности', 'Кол-во'],
      ...rows.map((r, idx) => [
        idx + 1,
        r.employee_name || '',
        r.personnel_number || '',
        r.position || '',
        r.site_name || '',
        r.item_name || '',
        categories[r.category] || r.category || '',
        formatReportDate(r.issue_date),
        formatReportDate(r.expiry_date),
        String(r.quantity || 1)
      ])
    ];

    const doc = new Document({
      styles: {
        default: {
          document: {
            run: { font: 'Times New Roman', size: 22 }
          }
        }
      },
      sections: [{
        properties: {
          page: {
            size: { width: 16838, height: 11906 },
            margin: { top: 720, bottom: 720, left: 720, right: 720 }
          }
        },
        children: [
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: 'ОТЧЁТ О ИСТЕКАЮЩИХ СРОКАХ ГОДНОСТИ СИЗ', font: 'Times New Roman', size: 22, bold: true })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 }, children: [new TextRun({ text: 'АЗС ИРБИС', font: 'Times New Roman', size: 22 })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 }, children: [new TextRun({ text: `Период: ближайшие ${months} месяцев`, font: 'Times New Roman', size: 22, bold: true })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 300 }, children: [new TextRun({ text: `Дата формирования: ${formatReportDate(new Date().toISOString())}`, font: 'Times New Roman', size: 22, italics: true })] }),
          buildTable(tableRows, [8, 16, 10, 14, 12, 18, 10, 11, 11, 7]),
          emptyP(),
          new Paragraph({ children: [new TextRun({ text: `Всего позиций с истекающим сроком: ${rows.length}`, font: 'Times New Roman', size: 22, italics: true })] }),
        ]
      }]
    });

    const buffer = await Packer.toBuffer(doc);
    const filename = `Отчёт_истекающие_сроки_${months}мес_${new Date().toISOString().split('T')[0]}.docx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
    res.send(buffer);
  } catch (error) {
    logger.error(error, 'exportExpiringReport error');
    next(error);
  }
}
