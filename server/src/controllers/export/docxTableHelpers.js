import {
  Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun,
  WidthType, AlignmentType, BorderStyle
} from 'docx';

export function makeCell(text, opts = {}) {
  const fontSize = opts.size || 22;
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

export function headerCell(text, width) {
  return makeCell(text, { bold: true, size: 22, shading: 'E7E6E6', width, spacingBefore: 60, spacingAfter: 60 });
}

export function buildTable(rows, columnWidths, fontSize = 21) {
  const headerRow = rows[0];
  const dataRows = rows.slice(1);
  const tableRows = [
    new TableRow({
      tableHeader: true,
      children: headerRow.map((h, i) => headerCell(h, columnWidths ? columnWidths[i] : undefined))
    }),
    ...dataRows.map(row => new TableRow({
      children: row.map((cell, i) => makeCell(cell, { width: columnWidths ? columnWidths[i] : undefined, size: fontSize }))
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

export function sectionTitle(text) {
  return new Paragraph({
    spacing: { before: 200, after: 120 },
    children: [new TextRun({ text, font: 'Times New Roman', size: 24, bold: true })]
  });
}

export function emptyP() {
  return new Paragraph({ spacing: { after: 60 }, children: [] });
}

export function formatReportDate(d) {
  if (!d) return '';
  const dt = new Date(d);
  const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  return `${dt.getDate()} ${months[dt.getMonth()]} ${dt.getFullYear()}`;
}
