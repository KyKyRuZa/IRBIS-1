import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

import { getNormsForEmployee } from '../../models/issueNormModel.js';
import { getIssueRecordsByEmployee } from '../../models/issueRecordModel.js';

export function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('ru-RU');
}

export function splitFullName(fullName) {
  const parts = (fullName || '').trim().split(/\s+/);
  return {
    lastName: parts[0] || '',
    firstName: parts[1] || '',
    middleName: parts[2] || '',
  };
}

export function matchNorms(employee, allNorms) {
  return allNorms.filter(n =>
    (n.gender == null || n.gender === employee.gender) &&
    (n.position == null || n.position === employee.position) &&
    (n.site_id == null || n.site_id === employee.site_id)
  );
}

export async function buildCardData(emp, norms, history) {
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
        model: record.certificate_number || '',
        issueDate: '',
        issueQty: String(record.quantity || ''),
        issueMethod: record.issue_method === 'dosator' ? 'в дозаторе' : (isConsumable ? 'лично' : ''),
        returnDate: (!isConsumable && record.return_date) ? formatDate(record.return_date) : '',
        returnQty: (!isConsumable && record.return_quantity !== undefined) ? String(record.return_quantity) : '',
        act: isConsumable ? '' : (record.write_off_act || ''),
      };
    }),
  };
}

export async function renderTemplate(templatePath, data) {
  const content = fs.readFileSync(templatePath);
  const { default: PizZip } = await import('pizzip');
  const zip = new PizZip(content);
  const { default: Docxtemplater } = await import('docxtemplater');
  const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
  doc.setData(data);
  await doc.render();
  return doc.getZip().generate({ type: 'nodebuffer' });
}

export async function loadTemplate(filename, data) {
  const templatePath = path.join(__dirname, '..', '..', 'templates', filename);
  const templateBuffer = fs.readFileSync(templatePath);
  const { default: PizZip } = await import('pizzip');
  const zip = new PizZip(templateBuffer);
  const { default: Docxtemplater } = await import('docxtemplater');
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  });
  doc.setData(data);
  return doc;
}
