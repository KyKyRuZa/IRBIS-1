import pool from '../../models/db.js';
import { logger } from '../../utils/logger.js';
import { buildTable, emptyP, formatReportDate } from './docxTableHelpers.js';
import { Document, Packer, Paragraph, TextRun, AlignmentType } from 'docx';

export async function exportItemsReport(req, res, next) {
  try {
    const result = await pool.query('SELECT * FROM item_types ORDER BY category, name');
    const rows = result.rows;
    const categories = { clothing: 'Спецодежда', footwear: 'Обувь', siz: 'СИЗ', consumable: 'Расходники' };
    const seasonality = { winter: 'Зимняя', summer: 'Летняя', year_round: 'Круглогодичная' };

    const tableRows = [
      ['№', 'Наименование', 'Категория', 'Единица', 'Срок годности (мес)', 'Сезонность', 'Требуется сертификат'],
      ...rows.map((r, idx) => [
        idx + 1,
        r.name || '',
        categories[r.category] || r.category || '',
        r.unit || '',
        String(r.default_wear_time_months || ''),
        seasonality[r.seasonality] || r.seasonality || '',
        r.requires_certificate ? 'Да' : 'Нет'
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
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: 'НОМЕНКЛАТУРА СПЕЦОДЕЖДЫ И СИЗ', font: 'Times New Roman', size: 22, bold: true })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 }, children: [new TextRun({ text: 'АЗС ИРБИС', font: 'Times New Roman', size: 22 })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 300 }, children: [new TextRun({ text: `Дата формирования: ${formatReportDate(new Date().toISOString())}`, font: 'Times New Roman', size: 22, italics: true })] }),
          buildTable(tableRows, [8, 24, 14, 10, 16, 14, 16]),
          emptyP(),
          new Paragraph({ children: [new TextRun({ text: `Всего позиций: ${rows.length}`, font: 'Times New Roman', size: 22, italics: true })] }),
        ]
      }]
    });

    const buffer = await Packer.toBuffer(doc);
    const filename = `Номенклатура_СИЗ_${new Date().toISOString().split('T')[0]}.docx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
    res.send(buffer);
  } catch (error) {
    logger.error(error, 'exportItemsReport error');
    next(error);
  }
}
