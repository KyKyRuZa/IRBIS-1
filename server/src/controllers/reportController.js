import ExcelJS from 'exceljs';
import {
  Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun,
  WidthType, AlignmentType, BorderStyle
} from 'docx';

import pool from '../models/db.js';

const categories = {
  clothing: 'Спецодежда',
  footwear: 'Обувь', 
  siz: 'СИЗ',
  consumable: 'Расходники'
};

function formatDate(d) {
  if (!d) return '';
  const dt = new Date(d);
  const monthTexts = {
    '01': 'января', '02': 'февраля', '03': 'марта', '04': 'апреля',
    '05': 'мая', '06': 'июня', '07': 'июля', '08': 'августа',
    '09': 'сентября', '10': 'октября', '11': 'ноября', '12': 'декабря'
  };
  return `${dt.getDate()} ${monthTexts[String(dt.getMonth() + 1).padStart(2, '0')]} ${dt.getFullYear()}`;
}

function makeCell(text, opts = {}) {
  const fontSize = opts.size || 21;
  const spacingBefore = opts.spacingBefore ?? 40;
  const spacingAfter = opts.spacingAfter ?? 40;
  const paragraphSpacing = { before: spacingBefore, after: spacingAfter };

  return new TableCell({
    children: [new Paragraph({
      spacing: paragraphSpacing,
      alignment: opts.alignment || AlignmentType.LEFT,
      children: [new TextRun({
        text: String(text ?? ''),
        font: 'Times New Roman',
        size: fontSize,
        bold: !!opts.bold,
        italics: !!opts.italics,
      })]
    })],
    width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
    verticalAlign: opts.verticalAlign,
    shading: opts.shading ? { fill: opts.shading } : undefined,
  });
}

function headerCell(text, width) {
  return makeCell(text, { bold: true, size: 22, shading: 'E7E6E6', width, spacingBefore: 60, spacingAfter: 60 });
}

function buildTable(rows, columnWidths) {
  const headerRow = rows[0];
  const dataRows = rows.slice(1);
  const tableRows = [
    new TableRow({
      tableHeader: true,
      children: headerRow.map((h, i) => headerCell(h, columnWidths ? columnWidths[i] : undefined))
    }),
    ...dataRows.map(row => new TableRow({
      children: row.map((cell, i) => makeCell(cell, { width: columnWidths ? columnWidths[i] : undefined }))
    }))
  ];
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 2 },
      bottom: { style: BorderStyle.SINGLE, size: 2 },
      left: { style: BorderStyle.SINGLE, size: 2 },
      right: { style: BorderStyle.SINGLE, size: 2 },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 2 },
      insideVertical: { style: BorderStyle.SINGLE, size: 2 },
    },
    rows: tableRows
  });
}

function sectionTitle(text) {
  return new Paragraph({
    spacing: { before: 200, after: 120 },
    children: [new TextRun({ text, font: 'Times New Roman', size: 24, bold: true })]
  });
}

function emptyP() {
  return new Paragraph({ spacing: { after: 60 }, children: [] });
}

export async function exportToExcel(req, res) {
  try {
    const { site_id, item_type_id, date_from, date_to, status } = req.query;
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Акт выдачи');

    worksheet.columns = [
      { header: '№', key: 'no', width: 5 },
      { header: 'Сотрудник', key: 'employee', width: 25 },
      { header: 'Должность', key: 'position', width: 20 },
      { header: 'Наименование', key: 'item', width: 25 },
      { header: 'Категория', key: 'category', width: 15 },
      { header: 'Дата выдачи', key: 'issue_date', width: 15 },
      { header: 'Срок годности', key: 'expiry_date', width: 15 }
    ];

    let query = `
      SELECT r.*, e.full_name as employee_name, e.position, it.name as item_name, it.category
      FROM issue_records r
      JOIN employees e ON r.employee_id = e.id
      JOIN item_types it ON r.item_type_id = it.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;
    if (site_id) { query += ` AND e.site_id = $${paramIndex++}`; params.push(site_id); }
    if (item_type_id) { query += ` AND r.item_type_id = $${paramIndex++}`; params.push(item_type_id); }
    if (status) { query += ` AND r.status = $${paramIndex++}`; params.push(status); }
    if (date_from) { query += ` AND r.issue_date >= $${paramIndex++}`; params.push(date_from); }
    if (date_to) { query += ` AND r.issue_date <= $${paramIndex++}`; params.push(date_to); }
    query += ' ORDER BY r.issue_date DESC';

    const result = await pool.query(query, params);

    result.rows.forEach((row, idx) => {
      worksheet.addRow({
        no: idx + 1,
        employee: row.employee_name,
        position: row.position,
        item: row.item_name,
        category: categories[row.category] || row.category,
        issue_date: row.issue_date ? new Date(row.issue_date).toLocaleDateString('ru-RU') : '',
        expiry_date: row.expiry_date ? new Date(row.expiry_date).toLocaleDateString('ru-RU') : ''
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=irbis-act-vydachi.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function exportDemandReport(req, res) {
  try {
    const { site_id } = req.query;
    const result = await pool.query(`
      SELECT 
        it.id as item_type_id,
        it.name as item_name,
        it.category,
        it.unit,
        COUNT(DISTINCT e.id) FILTER (WHERE e.status = 'active') as active_employees,
        COALESCE(SUM(ir.quantity), 0) as issued_qty,
        COALESCE(SUM(ir.return_quantity), 0) as returned_qty,
        COALESCE(SUM(ir.quantity) - SUM(ir.return_quantity), 0) as in_use_qty
      FROM item_types it
      CROSS JOIN employees e
      LEFT JOIN issue_norms in_ ON in_.item_type_id = it.id
      LEFT JOIN issue_records ir ON ir.item_type_id = it.id AND ir.employee_id = e.id AND ir.status NOT IN ('returned', 'disposed')
      ${site_id ? 'WHERE e.site_id = $1' : 'WHERE 1=1'}
      GROUP BY it.id, it.name, it.category, it.unit
      ORDER BY it.category, it.name
    `, site_id ? [site_id] : []);

    const rows = result.rows;
    const categories = { clothing: 'Спецодежда', footwear: 'Обувь', siz: 'СИЗ', consumable: 'Расходники' };

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Потребность в СИЗ');

    worksheet.columns = [
      { header: '№', key: 'no', width: 5 },
      { header: 'Наименование', key: 'item', width: 30 },
      { header: 'Категория', key: 'category', width: 15 },
      { header: 'Единица', key: 'unit', width: 10 },
      { header: 'Активных сотрудников', key: 'employees', width: 20 },
      { header: 'Выдано (шт)', key: 'issued', width: 15 },
      { header: 'Возвращено (шт)', key: 'returned', width: 15 },
      { header: 'Используется (шт)', key: 'in_use', width: 15 },
      { header: 'Норма (шт)', key: 'norm', width: 15 },
      { header: 'Потребность (шт)', key: 'demand', width: 15 }
    ];

    const norms = await pool.query(`
      SELECT in_.item_type_id, SUM(in_.quantity) as norm_qty
      FROM issue_norms in_
      JOIN employees e ON (e.gender = in_.gender OR in_.gender IS NULL)
      WHERE e.status = 'active'
      ${site_id ? 'AND e.site_id = $1' : ''}
      GROUP BY in_.item_type_id
    `, site_id ? [site_id] : []);

    const normMap = {};
    norms.rows.forEach(n => {
      normMap[n.item_type_id] = Number(n.norm_qty);
    });

    rows.forEach((r, idx) => {
      const normQty = normMap[r.item_type_id] || 0;
      const inUse = Number(r.in_use_qty);
      const demand = Math.max(0, normQty - inUse);
      worksheet.addRow({
        no: idx + 1,
        item: r.item_name,
        category: categories[r.category] || r.category,
        unit: r.unit || '-',
        employees: Number(r.active_employees),
        issued: Number(r.issued_qty),
        returned: Number(r.returned_qty),
        in_use: inUse,
        norm: normQty,
        demand: demand
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=potrebnost_siz.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function exportIssuesReport(req, res) {
  try {
    const { site_id, employee_id, item_type_id, date_from, date_to, status } = req.query;
    let query = `
      SELECT r.*, e.full_name as employee_name, e.position, e.personnel_number, s.name as site_name, it.name as item_name, it.category
      FROM issue_records r
      JOIN employees e ON r.employee_id = e.id
      JOIN item_types it ON r.item_type_id = it.id
      LEFT JOIN sites s ON e.site_id = s.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (site_id) { query += ` AND e.site_id = $${paramIndex++}`; params.push(site_id); }
    if (employee_id) { query += ` AND r.employee_id = $${paramIndex++}`; params.push(employee_id); }
    if (item_type_id) { query += ` AND r.item_type_id = $${paramIndex++}`; params.push(item_type_id); }
    if (status) { query += ` AND r.status = $${paramIndex++}`; params.push(status); }
    if (date_from) { query += ` AND r.issue_date >= $${paramIndex++}`; params.push(date_from); }
    if (date_to) { query += ` AND r.issue_date <= $${paramIndex++}`; params.push(date_to); }

    query += ' ORDER BY r.issue_date DESC';
    const result = await pool.query(query, params);

    const rows = result.rows;
    const categories = { clothing: 'Спецодежда', footwear: 'Обувь', siz: 'СИЗ', consumable: 'Расходники' };
    const monthTexts = {
      '01': 'января', '02': 'февраля', '03': 'марта', '04': 'апреля',
      '05': 'мая', '06': 'июня', '07': 'июля', '08': 'августа',
      '09': 'сентября', '10': 'октября', '11': 'ноября', '12': 'декабря'
    };

    const formatDate = (d) => {
      if (!d) return '';
      const dt = new Date(d);
      return `${dt.getDate()} ${monthTexts[String(dt.getMonth() + 1).padStart(2, '0')]} ${dt.getFullYear()}`;
    };

    const tableRows = [
      ['№', 'Сотрудник', 'Табельный №', 'Должность', 'Объект', 'Наименование СИЗ', 'Категория', 'Дата выдачи', 'Срок годности', 'Кол-во', 'Статус'],
      ...rows.map((r, idx) => [
        idx + 1,
        r.employee_name || '',
        r.personnel_number || '',
        r.position || '',
        r.site_name || '',
        r.item_name || '',
        categories[r.category] || r.category || '',
        formatDate(r.issue_date),
        formatDate(r.expiry_date),
        String(r.quantity || 1),
        r.status === 'issued' ? 'Выдано' : r.status === 'disposed' ? 'Списано' : r.status === 'returned' ? 'Возвращено' : r.status || ''
      ])
    ];

    const doc = new Document({
      sections: [{
        properties: {
          page: {
            size: { width: 16838, height: 11906 },
            margin: { top: 720, bottom: 720, left: 720, right: 720 }
          }
        },
        children: [
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: 'ОТЧЁТ О ВЫДАЧЕ СИЗ', font: 'Times New Roman', size: 28, bold: true })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 }, children: [new TextRun({ text: 'АЗС ИРБИС', font: 'Times New Roman', size: 24 })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 300 }, children: [new TextRun({ text: `Дата формирования: ${formatDate(new Date().toISOString())}`, font: 'Times New Roman', size: 22, italics: true })] }),
          buildTable(tableRows, [5, 16, 10, 14, 12, 18, 10, 11, 11, 7, 8]),
          emptyP(),
          new Paragraph({ children: [new TextRun({ text: `Всего записей: ${rows.length}`, font: 'Times New Roman', size: 22, italics: true })] }),
        ]
      }]
    });

    const buffer = await Packer.toBuffer(doc);
    const filename = `Отчёт_по_выдачам_${new Date().toISOString().split('T')[0]}.docx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
    res.send(buffer);
  } catch (error) {
    console.error('exportIssuesReport error', error);
    res.status(500).json({ error: error.message });
  }
}

export async function exportExpiringReport(req, res) {
  try {
    const months = parseInt(req.query.months) || 2;
    const result = await pool.query(`
      SELECT r.*, e.full_name as employee_name, e.position, e.personnel_number, s.name as site_name, it.name as item_name, it.category
      FROM issue_records r
      JOIN employees e ON r.employee_id = e.id
      JOIN item_types it ON r.item_type_id = it.id
      LEFT JOIN sites s ON e.site_id = s.id
      WHERE r.expiry_date <= NOW() + make_interval(months => $1)
        AND r.status = 'issued'
      ORDER BY r.expiry_date ASC
    `, [months]);

    const rows = result.rows;
    const categories = { clothing: 'Спецодежда', footwear: 'Обувь', siz: 'СИЗ', consumable: 'Расходники' };
    const monthTexts = {
      '01': 'января', '02': 'февраля', '03': 'марта', '04': 'апреля',
      '05': 'мая', '06': 'июня', '07': 'июля', '08': 'августа',
      '09': 'сентября', '10': 'октября', '11': 'ноября', '12': 'декабря'
    };

    const formatDate = (d) => {
      if (!d) return '';
      const dt = new Date(d);
      return `${dt.getDate()} ${monthTexts[String(dt.getMonth() + 1).padStart(2, '0')]} ${dt.getFullYear()}`;
    };

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
        formatDate(r.issue_date),
        formatDate(r.expiry_date),
        String(r.quantity || 1)
      ])
    ];

    const doc = new Document({
      sections: [{
        properties: {
          page: {
            size: { width: 16838, height: 11906 },
            margin: { top: 720, bottom: 720, left: 720, right: 720 }
          }
        },
        children: [
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: 'ОТЧЁТ О ИСТЕКАЮЩИХ СРОКАХ ГОДНОСТИ СИЗ', font: 'Times New Roman', size: 28, bold: true })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 }, children: [new TextRun({ text: 'АЗС ИРБИС', font: 'Times New Roman', size: 24 })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 }, children: [new TextRun({ text: `Период: ближайшие ${months} месяцев`, font: 'Times New Roman', size: 22, bold: true })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 300 }, children: [new TextRun({ text: `Дата формирования: ${formatDate(new Date().toISOString())}`, font: 'Times New Roman', size: 22, italics: true })] }),
          buildTable(tableRows, [5, 16, 10, 14, 12, 18, 10, 11, 11, 7]),
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
    console.error('exportExpiringReport error', error);
    res.status(500).json({ error: error.message });
  }
}

export async function exportItemsReport(req, res) {
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
        r.unit || '-',
        String(r.default_wear_time_months || '-'),
        seasonality[r.seasonality] || r.seasonality || '-',
        r.requires_certificate ? 'Да' : 'Нет'
      ])
    ];

    const doc = new Document({
      sections: [{
        properties: {
          page: {
            size: { width: 16838, height: 11906 },
            margin: { top: 720, bottom: 720, left: 720, right: 720 }
          }
        },
        children: [
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: 'НОМЕНКЛАТУРА СПЕЦОДЕЖДЫ И СИЗ', font: 'Times New Roman', size: 28, bold: true })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 }, children: [new TextRun({ text: 'АЗС ИРБИС', font: 'Times New Roman', size: 24 })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 300 }, children: [new TextRun({ text: `Дата формирования: ${new Date().toLocaleDateString('ru-RU')}`, font: 'Times New Roman', size: 22, italics: true })] }),
          buildTable(tableRows, [5, 24, 14, 10, 16, 14, 16]),
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
    console.error('exportItemsReport error', error);
    res.status(500).json({ error: error.message });
  }
}
