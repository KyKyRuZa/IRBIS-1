// Generates the two card templates used by the СИЗ card export flow:
//   - card-title-template.docx  (титульный лист: печатается один раз)
//   - card-sheet-template.docx  (лист выдачи: печатается на каждую выдачу,
//                                содержит только позиции этой выдачи)
// Run with: node src/scripts/generateCardTemplates.js

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  AlignmentType,
  BorderStyle,
  VerticalAlign,
} from 'docx'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const FONT = 'Times New Roman'
const A4 = { width: 11906, height: 16838 }
const MARGINS = { top: 720, bottom: 720, left: 850, right: 850 }

const BORDERS = {
  top: { style: BorderStyle.SINGLE, size: 1 },
  bottom: { style: BorderStyle.SINGLE, size: 1 },
  left: { style: BorderStyle.SINGLE, size: 1 },
  right: { style: BorderStyle.SINGLE, size: 1 },
  insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
  insideVertical: { style: BorderStyle.SINGLE, size: 1 },
}

function cell(text, opts = {}) {
  return new TableCell({
    children: [
      new Paragraph({
        spacing: { before: 20, after: 20 },
        alignment: opts.align || AlignmentType.LEFT,
        children: [
          new TextRun({
            text: String(text ?? ''),
            font: FONT,
            size: opts.size || 22,
            bold: !!opts.bold,
          }),
        ],
      }),
    ],
    width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
    verticalAlign: VerticalAlign.CENTER,
    shading: opts.fill ? { fill: opts.fill } : undefined,
  })
}

function headerCell(text, width) {
  return cell(text, { bold: true, width, fill: 'E7E6E6', align: AlignmentType.CENTER })
}

function emptyP() {
  return new Paragraph({ children: [] })
}

function infoTable(rows) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: BORDERS,
    rows: rows.map(
      ([label, value]) =>
        new TableRow({
          children: [cell(label, { width: 40, bold: true }), cell(value, { width: 60 })],
        })
    ),
  })
}

function normsTable(loopKey) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: BORDERS,
    rows: [
      new TableRow({
        children: [
          headerCell('Наименование СИЗ', 40),
          headerCell('Пункт норм ЕТН', 25),
          headerCell('Количество на период', 35),
        ],
      }),
      new TableRow({
        children: [
          cell(`{#${loopKey}}{name}`, { width: 40 }),
          cell('{etnPoint}', { width: 25 }),
          cell(`{period}{/${loopKey}}`, { width: 35 }),
        ],
      }),
    ],
  })
}

function sectionTitle(text) {
  return new Paragraph({
    spacing: { before: 120, after: 60 },
    children: [new TextRun({ text, font: FONT, size: 22, bold: true })],
  })
}

function titleTemplate() {
  return new Document({
    styles: { default: { document: { run: { font: FONT, size: 22 } } } },
    sections: [
      {
        properties: { page: { size: A4, margin: MARGINS } },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 60 },
            children: [
              new TextRun({
                text: 'ЛИЧНАЯ КАРТОЧКА № _______________',
                font: FONT,
                size: 26,
                bold: true,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 40 },
            children: [new TextRun({ text: 'учета выдачи СИЗ', font: FONT, size: 24 })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [
              new TextRun({ text: '(титульный лист)', font: FONT, size: 22, italics: true }),
            ],
          }),
          infoTable([
            ['Фамилия', '{lastName}'],
            ['Имя', '{firstName}'],
            ['Отчество', '{middleName}'],
            ['Табельный номер', '{personnelNumber}'],
            ['Структурное подразделение (объект)', '{siteName}'],
            ['Профессия (должность)', '{position}'],
            ['Дата поступления на работу', '{hireDate}'],
            ['Дата изменения профессии (должности) или перевода', '{positionChangeDate}'],
            ['Пол', '{gender}'],
            ['Рост', '{height}'],
            ['Размер одежды', '{clothingSize}'],
            ['Размер обуви', '{shoeSize}'],
            ['Размер головного убора', '{hatSize}'],
            ['Размер СИЗОД', '{respiratorSize}'],
            ['Размер СИЗ рук', '{glovesSize}'],
          ]),
          emptyP(),
          sectionTitle('ТАБЛИЦА НОРМ ВЫДАЧИ'),
          sectionTitle('Спецодежда, спецобувь и СИЗ'),
          normsTable('otherNorms'),
          sectionTitle('СИЗ для защиты от воды'),
          normsTable('waterNorms'),
          sectionTitle('СИЗ для защиты от пониженных температур'),
          normsTable('coldNorms'),
          sectionTitle('Дерматологические СИЗ и смывающие средства'),
          normsTable('dermatologicalNorms'),
          emptyP(),
          sectionTitle('Ответственное лицо за ведение карточек учета выдачи СИЗ'),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: BORDERS,
            rows: [
              new TableRow({
                children: [
                  cell('(подпись)', { width: 50 }),
                  cell('(фамилия, инициалы)', { width: 50 }),
                ],
              }),
            ],
          }),
        ],
      },
    ],
  })
}

function sheetTemplate() {
  const issueTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: BORDERS,
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          headerCell('№', 5),
          headerCell('Наименование СИЗ', 30),
          headerCell('Ед.', 6),
          headerCell('Количество', 11),
          headerCell('Лично/дозатор', 12),
          headerCell('Дата выдачи', 14),
          headerCell('Подпись получившего', 22),
        ],
      }),
      new TableRow({
        children: [
          cell('{#items}{n}', { width: 5, align: AlignmentType.CENTER }),
          cell('{itemName}', { width: 30 }),
          cell('{unit}', { width: 6, align: AlignmentType.CENTER }),
          cell('{quantity}', { width: 11, align: AlignmentType.CENTER }),
          cell('{issueMethod}', { width: 12, align: AlignmentType.CENTER }),
          cell('{issueDate}', { width: 14, align: AlignmentType.CENTER }),
          cell('{/items}', { width: 22 }),
        ],
      }),
    ],
  })

  return new Document({
    styles: { default: { document: { run: { font: FONT, size: 22 } } } },
    sections: [
      {
        properties: { page: { size: A4, margin: MARGINS } },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 40 },
            children: [
              new TextRun({
                text: 'ЛИЧНАЯ КАРТОЧКА № {personnelNumber}',
                font: FONT,
                size: 26,
                bold: true,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [new TextRun({ text: 'учета выдачи СИЗ', font: FONT, size: 24, bold: true })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 160 },
            children: [
              new TextRun({
                text: 'ЛИСТ ВЫДАЧИ № {sheetNumber} ЗА {year} ГОД',
                font: FONT,
                size: 24,
                bold: true,
              }),
            ],
          }),
          infoTable([
            ['Фамилия, имя, отчество', '{fullName}'],
            ['Табельный номер', '{personnelNumber}'],
            ['Профессия (должность)', '{position}'],
            ['Структурное подразделение (объект)', '{siteName}'],
          ]),
          emptyP(),
          issueTable,
          emptyP(),
          new Paragraph({
            spacing: { before: 160 },
            children: [
              new TextRun({
                text: 'Выдал (ответственное лицо): ______________________  (подпись)',
                font: FONT,
                size: 22,
              }),
            ],
          }),
          new Paragraph({
            spacing: { before: 120 },
            children: [
              new TextRun({
                text: 'Сотрудник: ______________________  (подпись)      Дата: ______________',
                font: FONT,
                size: 22,
              }),
            ],
          }),
        ],
      },
    ],
  })
}

async function write(name, doc) {
  const templatesDir = path.join(__dirname, '..', 'templates')
  if (!fs.existsSync(templatesDir)) fs.mkdirSync(templatesDir, { recursive: true })
  const buffer = await Packer.toBuffer(doc)
  fs.writeFileSync(path.join(templatesDir, name), buffer)
  console.log(`${name} generated`)
}

await write('card-title-template.docx', titleTemplate())
await write('card-sheet-template.docx', sheetTemplate())
console.log('Card templates generated successfully')
