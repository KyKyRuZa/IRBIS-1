import pool from '../../models/db.js';
import { logger } from '../../utils/logger.js';
import { buildTable, emptyP, formatReportDate } from './docxTableHelpers.js';
import { Document, Packer, Paragraph, TextRun, AlignmentType } from 'docx';

export async function exportGroupConsumablesReport(req, res, next) {
  try {
    const { site_id, period } = req.query;
    if (!site_id) return res.status(400).json({ error: 'Укажите объект' });

    const employees = await pool.query(`
      SELECT e.* FROM employees e WHERE e.site_id = $1 AND e.status = 'active' ORDER BY e.full_name
    `, [site_id]);

    const norms = await pool.query(`
      SELECT it.id as item_type_id, it.name as item_name, SUM(in_.quantity) as total_quantity
      FROM issue_norms in_
      JOIN item_types it ON it.id = in_.item_type_id
      WHERE it.category = 'consumable'
        AND (in_.site_id = $1 OR in_.site_id IS NULL)
      GROUP BY it.id, it.name
      ORDER BY it.name
    `, [site_id]);

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
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: 'ГРУППОВАЯ ВЕДОМОСТЬ ВЫДАЧИ РАСХОДНИКОВ', font: 'Times New Roman', size: 22, bold: true })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 }, children: [new TextRun({ text: 'АЗС ИРБИС', font: 'Times New Roman', size: 22 })] }),
          emptyP(),
          buildTable(
            [
              ['Сотрудник', ...norms.rows.map(n => n.item_name), 'Итого'],
              ...employees.rows.map(emp => {
                const vals = norms.rows.map(n => String(n.total_quantity || 1));
                const total = vals.reduce((sum, val) => sum + Number(val), 0);
                return [emp.full_name, ...vals, String(total)];
              })
            ],
            [25, ...norms.rows.map(() => 100 / norms.rows.length), 10],
            22
          ),
          emptyP(),
          new Paragraph({ children: [new TextRun({ text: `Дата формирования: ${formatReportDate(new Date().toISOString())}`, font: 'Times New Roman', size: 22, italics: true })] }),
        ]
      }]
    });

    const buffer = await Packer.toBuffer(doc);
    const filename = `Групповая_ведомость_расходники_${new Date().toISOString().split('T')[0]}.docx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
    res.send(buffer);
  } catch (error) {
    logger.error(error, 'exportGroupConsumablesReport error');
    next(error);
  }
}
