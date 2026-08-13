import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType, AlignmentType, BorderStyle, HeadingLevel } from 'docx';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function createTableBorder() {
  return {
    top: { style: BorderStyle.SINGLE, size: 1 },
    bottom: { style: BorderStyle.SINGLE, size: 1 },
    left: { style: BorderStyle.SINGLE, size: 1 },
    right: { style: BorderStyle.SINGLE, size: 1 },
  };
}

function makeCell(text, opts = {}) {
  return new TableCell({
    children: [new Paragraph({
      alignment: opts.alignment || AlignmentType.LEFT,
      children: [new TextRun({ text: String(text), font: 'Times New Roman', size: 22 })]
    })],
    width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
  });
}

function buildHeaderCell(text, width) {
  return new TableCell({
    children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text, font: 'Times New Roman', size: 22, bold: true })] })],
    width: { size: width, type: WidthType.PERCENTAGE },
  });
}

function emptyP() {
  return new Paragraph({ children: [] });
}

async function generateEmployeeCardTemplate() {
  const headerRows = [
    makeCell('Фамилия', { bold: true, width: 25 }),
    makeCell('{last_name}', { width: 75 }),
    makeCell('Имя, Отчество', { bold: true, width: 25 }),
    makeCell('{first_name_and_patronymic}', { width: 75 }),
    makeCell('Табельный номер', { bold: true, width: 25 }),
    makeCell('{employee_number}', { width: 75 }),
    makeCell('Структурное подразделение (объект)', { bold: true, width: 25 }),
    makeCell('{department}', { width: 75 }),
    makeCell('Профессия (должность)', { bold: true, width: 25 }),
    makeCell('{position}', { width: 75 }),
    makeCell('Дата поступления на работу', { bold: true, width: 25 }),
    makeCell('{hire_date}', { width: 75 }),
    makeCell('Дата изменения профессии/подразделения', { bold: true, width: 25 }),
    makeCell('{position_change_date}', { width: 75 }),
    makeCell('Пол', { bold: true, width: 25 }),
    makeCell('{gender}', { width: 75 }),
    makeCell('Рост', { bold: true, width: 25 }),
    makeCell('{height} см', { width: 75 }),
    makeCell('Размер одежды', { bold: true, width: 25 }),
    makeCell('{clothing_size}', { width: 75 }),
    makeCell('Размер обуви', { bold: true, width: 25 }),
    makeCell('{shoe_size}', { width: 75 }),
    makeCell('Размер головного убора', { bold: true, width: 25 }),
    makeCell('{hat_size}', { width: 75 }),
    makeCell('Размер СИЗОД', { bold: true, width: 25 }),
    makeCell('{respirator_size}', { width: 75 }),
    makeCell('Размер СИЗ рук', { bold: true, width: 25 }),
    makeCell('{gloves_size}', { width: 75 }),
  ];

  const headerTableRows = [];
  for (let i = 0; i < headerRows.length; i += 2) {
    headerTableRows.push(new TableRow({ children: [headerRows[i], headerRows[i + 1]] }));
  }

  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'ЛИЧНАЯ КАРТОЧКА УЧЁТА ВЫДАЧИ СИЗ', font: 'Times New Roman', size: 26, bold: true })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'АЗС ИРБИС', font: 'Times New Roman', size: 24 })] }),
        emptyP(),
        new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders: createTableBorder(), rows: headerTableRows }),
        emptyP(),
        new Paragraph({ children: [new TextRun({ text: 'ТАБЛИЦА НОРМ ВЫДАЧИ', font: 'Times New Roman', size: 24, bold: true })] }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: createTableBorder(),
          rows: [
            new TableRow({ children: ['Наименование СИЗ', 'Пункт норм ЕТН', 'Количество на период'].map((h, i) => buildHeaderCell(h, [35, 25, 40][i])) }),
            ...Array.from({ length: 20 }, () => new TableRow({
              children: ['{norms_name_0}', '{norms_etn_0}', '{norms_period_0}'].map((c, i) => makeCell(c, { width: [35, 25, 40][i] }))
            }))
          ]
        }),
        emptyP(),
        new Paragraph({ children: [new TextRun({ text: 'ОБОРОТНАЯ СТОРОНА — ЖУРНАЛ ФАКТИЧЕСКОЙ ВЫДАЧИ', font: 'Times New Roman', size: 24, bold: true })] }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: createTableBorder(),
          rows: [
            new TableRow({ children: ['Наименование СИЗ', 'Модель, марка, артикул, класс защиты', 'Дата выдачи', 'Количество', 'Лично/дозатор', 'Подпись получившего', 'Дата возврата', 'Количество возвращено', 'Подпись сдавшего', 'Акт списания (дата, номер)'].map((h, i) => buildHeaderCell(h, [16, 14, 10, 8, 8, 10, 10, 10, 8, 8][i])) }),
            ...Array.from({ length: 10 }, () => new TableRow({
              children: ['{history_name_0}', '', '{history_date_0}', '{history_qty_0}', '{history_type_0}', '', '{history_return_date_0}', '', '', ''].map((c, i) => makeCell(c, { width: [16, 14, 10, 8, 8, 10, 10, 10, 8, 8][i] }))
            }))
          ]
        }),
        emptyP(),
        new Paragraph({ children: [new TextRun({ text: 'Ответственное лицо за ведение карточек учёта выдачи СИЗ: ________________   Дата: {export_date}', font: 'Times New Roman', size: 22 })] }),
      ]
    }]
  });

  const buffer = await Packer.toBuffer(doc);
  const templatesDir = path.join(__dirname, '..', 'templates');
  if (!fs.existsSync(templatesDir)) fs.mkdirSync(templatesDir, { recursive: true });
  fs.writeFileSync(path.join(templatesDir, 'employee-card-template.docx'), buffer);
  console.log('Employee card template generated');
}

async function generateConsumablesTemplate() {
  const children = [
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'ВЕДОМОСТЬ ВЫДАЧИ РАСХОДНЫХ (ДЕРМАТОЛОГИЧЕСКИХ) СИЗ', font: 'Times New Roman', size: 26, bold: true })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '{period_label}', font: 'Times New Roman', size: 24 })] }),
  ];

  const tableHeader = ['Наименование СИЗ', 'Модель/марка', 'Дата выдачи', 'Количество', 'Лично/дозатор', 'Подпись получившего', 'Дата возврата', 'Количество возвращено', 'Подпись сдавшего', 'Акт списания (дата, номер)'];
  const columnWidths = [16, 14, 10, 8, 8, 10, 10, 10, 8, 8];

  const months = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь'];

  for (let m = 0; m < months.length; m++) {
    children.push(new Paragraph({ children: [new TextRun({ text: months[m], font: 'Times New Roman', size: 24, bold: true })] }));
    children.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: createTableBorder(),
      rows: [
        new TableRow({ children: tableHeader.map((h, i) => buildHeaderCell(h, columnWidths[i])) }),
        ...Array.from({ length: 4 }, () => new TableRow({
          children: [`{item_${m}_name}`, `{item_${m}_model}`, `{item_${m}_date}`, `{item_${m}_qty}`, 'лично', `{item_${m}_sign}`, '‒', '‒', '', ''].map((c, i) => makeCell(c, { width: columnWidths[i] }))
        }))
      ]
    }));
    children.push(emptyP());
  }

  const doc = new Document({ sections: [{ properties: {}, children }] });
  const buffer = await Packer.toBuffer(doc);
  const templatesDir = path.join(__dirname, '..', 'templates');
  if (!fs.existsSync(templatesDir)) fs.mkdirSync(templatesDir, { recursive: true });
  fs.writeFileSync(path.join(templatesDir, 'consumables-template.docx'), buffer);
  console.log('Consumables template generated');
}

await generateEmployeeCardTemplate();
await generateConsumablesTemplate();
console.log('All templates generated successfully');