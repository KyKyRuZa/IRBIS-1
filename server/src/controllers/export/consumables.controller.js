import pool from '../../models/db.js';
import { logger } from '../../utils/logger.js';
import {
  Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun,
  WidthType, AlignmentType, BorderStyle, VerticalAlign
} from 'docx';

const FONT = 'Times New Roman';
const SIZE = 21;
const HEADER_SIZE = 22;
const TITLE_SIZE = 26;
const SUBTITLE_SIZE = 22;

function cell(text, opts = {}) {
  const p = new Paragraph({
    spacing: { before: 30, after: 30 },
    alignment: opts.align || AlignmentType.LEFT,
    children: [new TextRun({
      text: String(text ?? ''),
      font: FONT,
      size: opts.size || SIZE,
      bold: !!opts.bold,
    })]
  });
  return new TableCell({
    children: [p],
    width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
    verticalAlign: opts.vAlign || VerticalAlign.CENTER,
    shading: opts.fill ? { fill: opts.fill } : undefined,
  });
}

function headerCell(text, width) {
  return cell(text, { bold: true, size: HEADER_SIZE, width, fill: 'E7E6E6', align: AlignmentType.CENTER });
}

function monthTable(rows) {
  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      headerCell('Наименование СИЗ', 14),
      headerCell('Модель/марка', 12),
      headerCell('Дата выдачи', 12),
      headerCell('Количество', 6),
      headerCell('Лично/дозатор', 8),
      headerCell('Подпись получившего', 10),
      headerCell('Дата возврата', 10),
      headerCell('Количество возвращено', 8),
      headerCell('Подпись сдавшего', 8),
      headerCell('Акт списания (дата, номер)', 6),
    ]
  });

  const bodyRows = rows.length === 0
    ? [new TableRow({
        children: [
          cell('', { width: 14 }),
          cell('', { width: 12 }),
          cell('', { width: 12, align: AlignmentType.CENTER }),
          cell('', { width: 6, align: AlignmentType.CENTER }),
          cell('', { width: 8, align: AlignmentType.CENTER }),
          cell('', { width: 10 }),
          cell('', { width: 10, align: AlignmentType.CENTER }),
          cell('', { width: 8, align: AlignmentType.CENTER }),
          cell('', { width: 8 }),
          cell('', { width: 6 }),
        ]
      })]
    : rows.map((r) => new TableRow({
        children: [
          cell(r.item_type_name || '', { width: 14 }),
          cell(r.certificate_number || '', { width: 12 }),
          cell(r.issue_date ? new Date(r.issue_date).toLocaleDateString('ru-RU') : '', { width: 12, align: AlignmentType.CENTER }),
          cell(String(r.quantity || ''), { width: 6, align: AlignmentType.CENTER }),
          cell(r.issue_method === 'dosator' ? 'в дозаторе' : 'лично', { width: 8, align: AlignmentType.CENTER }),
          cell('', { width: 10 }),
          cell('', { width: 10, align: AlignmentType.CENTER }),
          cell('', { width: 8, align: AlignmentType.CENTER }),
          cell('', { width: 8 }),
          cell('', { width: 6 }),
        ]
      }));

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1 },
      bottom: { style: BorderStyle.SINGLE, size: 1 },
      left: { style: BorderStyle.SINGLE, size: 1 },
      right: { style: BorderStyle.SINGLE, size: 1 },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
      insideVertical: { style: BorderStyle.SINGLE, size: 1 },
    },
    rows: [headerRow, ...bodyRows]
  });
}

export async function exportConsumables(req, res, next) {
  try {
    const result = await pool.query(`
      SELECT e.*, s.name as site_name
      FROM employees e
      LEFT JOIN sites s ON e.site_id = s.id
      WHERE e.id = $1
    `, [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Employee not found' });

    const emp = result.rows[0];
    const period = req.query.period || 'first';

    const year = new Date().getFullYear();
    const monthStart = period === 'first' ? 0 : 6;
    const monthEnd = period === 'first' ? 6 : 12;
    const months = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];

    const history = await pool.query(`
      SELECT r.issue_date, r.quantity, r.issue_method, c.certificate_number,
             it.name as item_type_name
      FROM issue_records r
      JOIN item_types it ON r.item_type_id = it.id
      LEFT JOIN certificates c ON r.certificate_id = c.id
      WHERE r.employee_id = $1
        AND it.category = 'consumable'
        AND EXTRACT(MONTH FROM r.issue_date) BETWEEN $2 AND $3
        AND EXTRACT(YEAR FROM r.issue_date) = $4
      ORDER BY r.issue_date ASC
    `, [emp.id, monthStart + 1, monthEnd, year]);

    const rowsByMonth = {};
    for (let m = monthStart; m < monthEnd; m++) rowsByMonth[m] = [];
    history.rows.forEach(r => {
      const m = new Date(r.issue_date).getMonth();
      if (m >= monthStart && m < monthEnd) rowsByMonth[m].push(r);
    });

    const children = [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [new TextRun({ text: 'ВЕДОМОСТЬ ВЫДАЧИ РАСХОДНЫХ (ДЕРМАТОЛОГИЧЕСКИХ) СИЗ', font: FONT, size: TITLE_SIZE, bold: true })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 300 },
        children: [new TextRun({ text: period === 'first' ? 'I полугодие' : 'II полугодие', font: FONT, size: SUBTITLE_SIZE, bold: true })]
      }),
    ];

    for (let m = monthStart; m < monthEnd; m++) {
      children.push(new Paragraph({
        spacing: { before: 200, after: 100 },
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: months[m], font: FONT, size: HEADER_SIZE, bold: true })]
      }));
      children.push(monthTable(rowsByMonth[m] || []));
      children.push(new Paragraph({ spacing: { after: 60 }, children: [] }));
    }

    children.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1 },
        bottom: { style: BorderStyle.SINGLE, size: 1 },
        left: { style: BorderStyle.SINGLE, size: 1 },
        right: { style: BorderStyle.SINGLE, size: 1 },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
        insideVertical: { style: BorderStyle.SINGLE, size: 1 },
      },
      rows: [
        new TableRow({
          children: [
            cell('Ответственное лицо за ведение карточек учета выдачи СИЗ', { width: 50, bold: true }),
            cell('', { width: 25 }),
            cell('', { width: 25 }),
          ]
        }),
        new TableRow({
          children: [
            cell('', { width: 50 }),
            cell('(подпись)', { width: 25, align: AlignmentType.CENTER }),
            cell('(фамилия, инициалы)', { width: 25, align: AlignmentType.CENTER }),
          ]
        }),
      ]
    }));

    const doc = new Document({
      styles: {
        default: {
          document: {
            run: { font: FONT, size: SIZE }
          }
        }
      },
      sections: [{
        properties: {
          page: {
            size: { width: 16838, height: 11906 },
            margin: { top: 720, bottom: 720, left: 900, right: 900 }
          }
        },
        children
      }]
    });

    const buffer = await Packer.toBuffer(doc);
    const filename = `Ведомость_расходников_${emp.full_name}_${emp.personnel_number || emp.id}_${period === 'first' ? 'I' : 'II'}.docx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
    res.send(buffer);
  } catch (error) {
    logger.error(error, 'exportConsumables error');
    next(error);
  }
}
