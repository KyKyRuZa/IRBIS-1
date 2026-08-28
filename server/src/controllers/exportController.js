import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../models/db.js';
import { logger } from '../utils/logger.js';
import { getNormsForEmployee } from '../models/issueNormModel.js';
import { getIssueRecordsByEmployee } from '../models/issueRecordModel.js';
import {
  Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun,
  WidthType, AlignmentType, BorderStyle, HeadingLevel
} from 'docx';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('ru-RU');
}

function splitFullName(fullName) {
  const parts = (fullName || '').trim().split(/\s+/);
  return {
    lastName: parts[0] || '',
    firstName: parts[1] || '',
    middleName: parts[2] || '',
  };
}

function matchNorms(employee, allNorms) {
  return allNorms.filter(n =>
    (n.gender == null || n.gender === employee.gender) &&
    (n.position == null || n.position === employee.position) &&
    (n.site_id == null || n.site_id === employee.site_id)
  );
}

async function buildCardData(emp, norms, history) {
  const nameParts = splitFullName(emp.full_name);
  if (norms === undefined) norms = await getNormsForEmployee(emp);
  if (history === undefined) history = await getIssueRecordsByEmployee(emp.id);

  const normRows = norms.map(n => ({
    name: n.item_type_name || '',
    etnPoint: n.etn_point || '',
    period: n.period_text ? `${n.quantity} шт. в ${n.period_text}` : `${n.quantity} шт.`,
    category: n.category || '',
  }));

  const toGroup = (arr) => arr.length > 0 ? arr : [{ name: '', etnPoint: '', period: '' }];

  const otherNorms = toGroup(normRows.filter(n => ['clothing', 'footwear', 'siz'].includes(n.category)).map(({ category, ...rest }) => rest));
  const waterNorms = toGroup([]);
  const coldNorms = toGroup([]);
  const dermatologicalNorms = toGroup(normRows.filter(n => n.category === 'consumable').map(({ category, ...rest }) => rest));

  return {
    lastName: nameParts.lastName,
    firstName: nameParts.firstName,
    middleName: nameParts.middleName,
    personnelNumber: emp.personnel_number || '',
    siteName: emp.site_name || '',
    position: emp.position || '',
    hireDate: formatDate(emp.hire_date),
    positionChangeDate: formatDate(emp.position_change_date),
    gender: emp.gender === 'male' ? 'Мужской' : emp.gender === 'female' ? 'Женский' : '',
    height: emp.height || '',
    clothingSize: emp.clothing_size || '',
    shoeSize: emp.shoe_size || '',
    hatSize: emp.hat_size || '',
    respiratorSize: emp.respirator_size || '',
    glovesSize: emp.gloves_size || '',
    otherNorms,
    waterNorms,
    coldNorms,
    dermatologicalNorms,
    signatureGet: '',
    signatureReturn: '',
    responsiblePerson: emp.site_responsible || '',
    history: history.map(record => {
      const isConsumable = record.category === 'consumable';
      return {
        itemName: record.item_type_name || '',
        model: record.certificate_number || '‒',
        issueDate: formatDate(record.issue_date),
        issueQty: String(record.quantity || ''),
        issueMethod: record.issue_method || (isConsumable ? 'лично' : '‒'),
        returnDate: (!isConsumable && record.return_date) ? formatDate(record.return_date) : '‒',
        returnQty: (!isConsumable && record.return_quantity !== undefined) ? String(record.return_quantity) : '‒',
        act: isConsumable ? '' : (record.write_off_act || ''),
      };
    }),
  };
}

// Загрузка и рендеринг шаблона
async function renderTemplate(templatePath, data) {
  const content = fs.readFileSync(templatePath);
  const { default: PizZip } = await import('pizzip');
  const zip = new PizZip(content);
  const { default: Docxtemplater } = await import('docxtemplater');
  const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
  doc.setData(data);
  await doc.render();
  return doc.getZip().generate({ type: 'nodebuffer' });
}

async function loadTemplate(filename) {
  const templatePath = path.join(__dirname, '..', 'templates', filename);
  const templateBuffer = fs.readFileSync(templatePath);
  const { default: PizZip } = await import('pizzip');
  const zip = new PizZip(templateBuffer);
  const { default: Docxtemplater } = await import('docxtemplater');
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  });
  return doc;
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

    const templatePath = path.join(__dirname, '..', 'templates', 'card-template.docx');
    const templateBuffer = fs.readFileSync(templatePath);
    const { default: PizZip } = await import('pizzip');
    const zip = new PizZip(templateBuffer);
    const { default: Docxtemplater } = await import('docxtemplater');
    const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
    doc.setData(data);
    await doc.render();
    const buffer = doc.getZip().generate({ type: 'nodebuffer' });

    const filename = `Карточка_СИЗ_${emp.full_name}_${emp.personnel_number || emp.id}.docx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
    res.send(buffer);
  } catch (error) {
    logger.error(error, 'exportEmployeeCard error');
    next(error);
  }
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
    const doc = await loadTemplate('consumables-template.docx');

    const norms = await getNormsForEmployee(emp);
    const consumables = norms.filter((n) => n.category === 'consumable');

    const months = period === 'first'
      ? ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь']
      : ['Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];

    const data = {
      employee_name: emp.full_name || '',
      personnel_number: emp.personnel_number || '',
      period_label: period === 'first' ? 'I полугодие' : 'II полугодие',
    };

    for (let m = 0; m < months.length; m++) {
      for (let i = 0; i < 4; i++) {
        const idx = m * 4 + i;
        const item = consumables[i] || {};
        data[`item_${m}_name`] = item.item_type_name || '';
        data[`item_${m}_model`] = '';
        data[`item_${m}_date`] = '';
        data[`item_${m}_qty`] = '';
        data[`item_${m}_sign`] = '';
      }
    }

    doc.setData(data);
    await doc.render();

    const buffer = doc.getZip().generate({ type: 'nodebuffer' });
    const filename = `Ведомость_расходников_${emp.full_name}_${emp.personnel_number || emp.id}_${period === 'first' ? 'I' : 'II'}.docx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
    res.send(buffer);
  } catch (error) {
    logger.error(error, 'exportConsumables error');
    next(error);
  }
}

export async function exportAllCards(req, res, next) {
  try {
    const result = await pool.query(`
      SELECT e.*, s.name as site_name, s.responsible_person as site_responsible
      FROM employees e
      LEFT JOIN sites s ON e.site_id = s.id
      WHERE e.status = $1
    `, ['active']);
    const employees = result.rows;

    // Batch-load norms and issue history once instead of issuing 2 queries per
    // employee (the old N+1 loop). Norms are matched per employee in memory using
    // the same predicate as getNormsForEmployee; history is grouped by employee_id.
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

    const { ZipArchive } = await import('archiver');
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

    const templatePath = path.join(__dirname, '..', 'templates', 'card-template.docx');

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

export async function exportIssuesReport(req, res, next) {
  try {
    const result = await pool.query(`
      SELECT r.*, e.full_name as employee_name, e.position, e.personnel_number, s.name as site_name, it.name as item_name, it.category
      FROM issue_records r
      JOIN employees e ON r.employee_id = e.id
      JOIN item_types it ON r.item_type_id = it.id
      LEFT JOIN sites s ON e.site_id = s.id
      ORDER BY r.issue_date DESC
    `);

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
        r.status === 'issued' ? 'Выдано' : r.status === 'disposed' ? 'Списано' : r.status || ''
      ])
    ];

    const doc = new Document({
      sections: [{
        properties: {
          page: {
            size: {
              width: 16838,
              height: 11906,
            },
            margin: {
              top: 720,
              bottom: 720,
              left: 720,
              right: 720,
            }
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
    logger.error(error, 'exportIssuesReport error');
    next(error);
  }
}

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
            size: {
              width: 16838,
              height: 11906,
            },
            margin: {
              top: 720,
              bottom: 720,
              left: 720,
              right: 720,
            }
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
    logger.error(error, 'exportExpiringReport error');
    next(error);
  }
}

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
            size: {
              width: 16838,
              height: 11906,
            },
            margin: {
              top: 720,
              bottom: 720,
              left: 720,
              right: 720,
            }
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
    logger.error(error, 'exportItemsReport error');
    next(error);
  }
}

export async function exportGroupConsumablesReport(req, res, next) {
  try {
    const { site_id, period } = req.query;
    if (!site_id) return res.status(400).json({ error: 'site_id is required' });

    const employees = await pool.query(`
      SELECT e.* FROM employees e WHERE e.site_id = $1 AND e.status = 'active' ORDER BY e.full_name
    `, [site_id]);

    const norms = await pool.query(`
      SELECT in_.item_type_id, it.name as item_name, in_.period_text, in_.quantity, in_.period_months
      FROM issue_norms in_
      JOIN item_types it ON it.id = in_.item_type_id
      WHERE it.category = 'consumable'
        AND (in_.site_id = $1 OR in_.site_id IS NULL)
    `, [site_id]);

    const doc = new Document({
      sections: [{
        properties: {
          page: {
            size: { width: 16838, height: 11906 },
            margin: { top: 720, bottom: 720, left: 720, right: 720 }
          }
        },
        children: [
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: 'ГРУППОВАЯ ВЕДОМОСТЬ ВЫДАЧИ РАСХОДНИКОВ', font: 'Times New Roman', size: 28, bold: true })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 }, children: [new TextRun({ text: 'АЗС ИРБИС', font: 'Times New Roman', size: 24 })] }),
          emptyP(),
          buildTable(
            [
              ['Сотрудник', ...norms.rows.map(n => n.item_name), 'Итого'],
              ...employees.rows.map(emp => {
                const vals = norms.rows.map(() => '1');
                return [emp.full_name, ...vals, String(vals.length)];
              })
            ],
            [20, ...norms.rows.map(() => 10), 8]
          ),
          emptyP(),
          new Paragraph({ children: [new TextRun({ text: `Дата формирования: ${new Date().toLocaleDateString('ru-RU')}`, font: 'Times New Roman', size: 22, italics: true })] }),
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
