import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import PizZip from 'pizzip'
import Docxtemplater from 'docxtemplater'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

import { getNormsForEmployee } from '../../models/issueNormModel.js'
import { getIssueRecordsByEmployee } from '../../models/issueRecordModel.js'

const templateCache = new Map()

export function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('ru-RU')
}

export function splitFullName(fullName) {
  const parts = (fullName || '').trim().split(/\s+/)
  return {
    lastName: parts[0] || '',
    firstName: parts[1] || '',
    middleName: parts[2] || '',
  }
}

export function matchNorms(employee, allNorms) {
  return allNorms.filter(
    (n) =>
      (n.gender == null || n.gender === employee.gender) &&
      (n.position == null || n.position === employee.position) &&
      (n.site_id == null || n.site_id === employee.site_id)
  )
}

export async function buildCardData(emp, norms, history) {
  const nameParts = splitFullName(emp.full_name)
  if (norms === undefined) norms = await getNormsForEmployee(emp)
  if (history === undefined) history = await getIssueRecordsByEmployee(emp.id)

  return {
    ...buildEmployeeData(emp, nameParts),
    otherNorms: groupNorms(norms, ['clothing', 'footwear', 'siz']),
    waterNorms: groupNorms(norms, ['water']),
    coldNorms: groupNorms(norms, ['cold']),
    dermatologicalNorms: groupNorms(norms, ['consumable']),
    signatureGet: '',
    signatureReturn: '',
    responsiblePerson: emp.site_responsible || '',
    history: history.map((record) => {
      const isConsumable = record.category === 'consumable'
      return {
        itemName: record.item_type_name || '',
        model: record.certificate_number || '',
        issueDate: formatDate(record.issue_date),
        issueQty: String(record.quantity || ''),
        issueMethod: record.issue_method === 'dosator' ? 'в дозаторе' : isConsumable ? 'лично' : '',
        returnDate: !isConsumable && record.return_date ? formatDate(record.return_date) : '',
        returnQty:
          !isConsumable && record.return_quantity !== undefined
            ? String(record.return_quantity)
            : '',
        act: isConsumable ? '' : record.write_off_act || '',
      }
    }),
  }
}

function buildEmployeeData(emp, nameParts) {
  const parts = nameParts || splitFullName(emp.full_name)
  return {
    fullName: (emp.full_name || '').trim(),
    lastName: parts.lastName,
    firstName: parts.firstName,
    middleName: parts.middleName,
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
  }
}

function groupNorms(norms, categories) {
  const normRows = norms
    .filter((n) => categories.includes(n.category))
    .map((n) => ({
      name: n.item_type_name || '',
      etnPoint: n.etn_point || '',
      period: n.period_text ? `${n.quantity} шт. в ${n.period_text}` : `${n.quantity} шт.`,
    }))
  return normRows.length > 0 ? normRows : [{ name: '', etnPoint: '', period: '' }]
}

// Данные для титульного листа: печатается один раз при приёме сотрудника
// или обновлении карточки, полный список норм по должности.
export async function buildTitleData(emp, norms) {
  const nameParts = splitFullName(emp.full_name)
  if (norms === undefined) norms = await getNormsForEmployee(emp)

  return {
    ...buildEmployeeData(emp, nameParts),
    otherNorms: groupNorms(norms, ['clothing', 'footwear', 'siz']),
    waterNorms: groupNorms(norms, ['water']),
    coldNorms: groupNorms(norms, ['cold']),
    dermatologicalNorms: groupNorms(norms, ['consumable']),
  }
}

// Данные для листа выдачи: только позиции одной выдачи (события) и номер
// листа в рамках календарного года (титульный лист = 1).
export function buildSheetData(emp, items, sheetNumber, year) {
  const nameParts = splitFullName(emp.full_name)

  return {
    ...buildEmployeeData(emp, nameParts),
    sheetNumber: String(sheetNumber),
    year: String(year),
    items: (items || []).map((record, index) => ({
      n: String(index + 1),
      itemName: record.item_type_name || '',
      unit: record.unit || 'шт',
      quantity: String(record.quantity ?? ''),
      issueMethod: record.issue_method === 'dosator' ? 'дозатор' : 'лично',
      issueDate: formatDate(record.issue_date),
    })),
  }
}

export async function renderTemplate(templatePath, data) {
  let templateBuffer = templateCache.get(templatePath)
  if (!templateBuffer) {
    templateBuffer = fs.readFileSync(templatePath)
    templateCache.set(templatePath, templateBuffer)
  }
  const zip = new PizZip(templateBuffer)
  const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true })
  doc.render(data)
  return doc.getZip().generate({ type: 'nodebuffer' })
}

export async function loadTemplate(filename, _data) {
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    throw new Error('Invalid template filename: path traversal detected')
  }
  const templatePath = path.join(__dirname, '..', '..', 'templates', filename)
  let templateBuffer = templateCache.get(templatePath)
  if (!templateBuffer) {
    templateBuffer = fs.readFileSync(templatePath)
    templateCache.set(templatePath, templateBuffer)
  }
  const zip = new PizZip(templateBuffer)
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  })
  return doc
}
