import ExcelJS from 'exceljs';

import pool from '../models/db.js';

const categories = {
  clothing: 'Спецодежда',
  footwear: 'Обувь', 
  siz: 'СИЗ',
  consumable: 'Расходники'
};

export async function exportToExcel(req, res) {
  try {
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

    const result = await pool.query(`
      SELECT r.*, e.full_name as employee_name, e.position, it.name as item_name, it.category
      FROM issue_records r
      JOIN employees e ON r.employee_id = e.id
      JOIN item_types it ON r.item_type_id = it.id
      ORDER BY r.issue_date DESC
    `);

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
