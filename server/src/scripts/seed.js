import pool from '../models/db.js';

const clearAll = async () => {
  await pool.query('DELETE FROM issue_records');
  await pool.query('DELETE FROM issue_norms');
  await pool.query('DELETE FROM certificates');
  await pool.query('DELETE FROM employees');
  await pool.query('DELETE FROM item_types');
  await pool.query('DELETE FROM sites');
};

const seedSites = async () => {
  const sites = [
    { name: 'АЗС №1 "Ирбис"', responsible_person: 'Петров Алексей Сергеевич' },
    { name: 'АЗС №2 "Северная"', responsible_person: 'Сидорова Марина Ивановна' },
    { name: 'АЗС №3 "Южная"', responsible_person: 'Кузнецова Ольга Петровна' },
  ];
  const result = await pool.query('INSERT INTO sites (name, responsible_person) VALUES ($1, $2), ($3, $4), ($5, $6) RETURNING id, name', [
    sites[0].name, sites[0].responsible_person,
    sites[1].name, sites[1].responsible_person,
    sites[2].name, sites[2].responsible_person,
  ]);
  return result.rows;
};

const seedEmployees = async (sites) => {
  const employees = [
    { full_name: 'Иванов Иван Иванович', position: 'Наполнитель баллонов', site_id: sites[0].id, gender: 'male', hire_date: '2019-03-15', clothing_size: '48-50', shoe_size: '42', height: 175, personnel_number: 'ИБ-0001', hat_size: '56', respirator_size: 'M', gloves_size: '10' },
    { full_name: 'Емельянов Егор Петрович', position: 'Наполнитель баллонов', site_id: sites[0].id, gender: 'male', hire_date: '2020-05-20', clothing_size: '52-54', shoe_size: '44', height: 182, personnel_number: 'ИБ-0002', hat_size: '58', respirator_size: 'L', gloves_size: '11' },
    { full_name: 'Смирнова Анна Владимировна', position: 'Оператор АЗС', site_id: sites[0].id, gender: 'female', hire_date: '2021-01-10', clothing_size: '44-46', shoe_size: '37', height: 165, personnel_number: 'ОП-0001', hat_size: '54', respirator_size: 'S', gloves_size: '8' },
    { full_name: 'Козлов Михаил Юрьевич', position: 'Оператор АЗС', site_id: sites[0].id, gender: 'male', hire_date: '2021-06-01', clothing_size: '48-50', shoe_size: '42', height: 178, personnel_number: 'ОП-0002', hat_size: '56', respirator_size: 'M', gloves_size: '9' },
    { full_name: 'Морозова Юлия Дмитриевна', position: 'Старший оператор', site_id: sites[1].id, gender: 'female', hire_date: '2018-09-12', clothing_size: '46-48', shoe_size: '38', height: 168, personnel_number: 'СО-0001', hat_size: '55', respirator_size: 'S/M', gloves_size: '8' },
    { full_name: 'Волков Сергей Николаевич', position: 'Мастер АЗС', site_id: sites[1].id, gender: 'male', hire_date: '2017-11-05', clothing_size: '50-52', shoe_size: '43', height: 180, personnel_number: 'МА-0001', hat_size: '57', respirator_size: 'L', gloves_size: '10' },
    { full_name: 'Новикова Елена Александровна', position: 'Кассир', site_id: sites[1].id, gender: 'female', hire_date: '2022-02-14', clothing_size: '44-46', shoe_size: '36', height: 162, personnel_number: 'КА-0001', hat_size: '54', respirator_size: 'S', gloves_size: '7' },
    { full_name: 'Лебедев Артём Игоревич', position: 'Электрик', site_id: sites[2].id, gender: 'male', hire_date: '2020-08-01', clothing_size: '48-50', shoe_size: '42', height: 176, personnel_number: 'ЭЛ-0001', hat_size: '56', respirator_size: 'M', gloves_size: '9' },
    { full_name: 'Павлова Светлана Юрьевна', position: 'Сварщик', site_id: sites[2].id, gender: 'female', hire_date: '2019-07-22', clothing_size: '46-48', shoe_size: '37', height: 163, personnel_number: 'СВ-0001', hat_size: '54', respirator_size: 'S', gloves_size: '8' },
    { full_name: 'Семенов Денис Олегович', position: 'Заправщик', site_id: sites[2].id, gender: 'male', hire_date: '2023-03-10', clothing_size: '50-52', shoe_size: '43', height: 183, personnel_number: 'ЗА-0001', hat_size: '57', respirator_size: 'L', gloves_size: '11' },
  ];
  const result = [];
  for (const e of employees) {
    const r = await pool.query(`INSERT INTO employees 
      (full_name, position, site_id, gender, hire_date, clothing_size, shoe_size, height, personnel_number, hat_size, respirator_size, gloves_size)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [e.full_name, e.position, e.site_id, e.gender, e.hire_date, e.clothing_size, e.shoe_size, e.height, e.personnel_number, e.hat_size, e.respirator_size, e.gloves_size]);
    result.push(r.rows[0]);
  }
  return result;
};

const seedItemTypes = async () => {
  const items = [
    { name: 'Костюм хлопчатобумажный', category: 'clothing', unit: 'комплект', default_wear_time_months: 36, seasonality: 'year_round', requires_certificate: false },
    { name: 'Куртка зимняя', category: 'clothing', unit: 'шт', default_wear_time_months: 36, seasonality: 'winter', requires_certificate: false },
    { name: 'Костюм летний', category: 'clothing', unit: 'комплект', default_wear_time_months: 12, seasonality: 'summer', requires_certificate: false },
    { name: 'Сапоги резиновые', category: 'footwear', unit: 'пара', default_wear_time_months: 12, seasonality: 'year_round', requires_certificate: false },
    { name: 'Ботинки кожаные', category: 'footwear', unit: 'пара', default_wear_time_months: 24, seasonality: 'year_round', requires_certificate: false },
    { name: 'Беруши', category: 'siz', unit: 'пара', default_wear_time_months: 6, seasonality: 'year_round', requires_certificate: false },
    { name: 'Очки защитные', category: 'siz', unit: 'шт', default_wear_time_months: 12, seasonality: 'year_round', requires_certificate: false },
    { name: 'Каска', category: 'siz', unit: 'шт', default_wear_time_months: 24, seasonality: 'year_round', requires_certificate: false },
    { name: 'Респиратор FFP2', category: 'siz', unit: 'шт', default_wear_time_months: 1, seasonality: 'year_round', requires_certificate: true },
    { name: 'Крем для рук', category: 'consumable', unit: 'туба', default_wear_time_months: 1, seasonality: 'year_round', requires_certificate: false },
    { name: 'Мыло жидкое', category: 'consumable', unit: 'флакон', default_wear_time_months: 1, seasonality: 'year_round', requires_certificate: false },
    { name: 'Перчатки нитриловые', category: 'consumable', unit: 'пара', default_wear_time_months: 1, seasonality: 'year_round', requires_certificate: false },
    { name: 'Перчатки латексные', category: 'consumable', unit: 'пара', default_wear_time_months: 1, seasonality: 'year_round', requires_certificate: false },
  ];
  const result = [];
  for (const i of items) {
    const r = await pool.query('INSERT INTO item_types (name, category, unit, default_wear_time_months, seasonality, requires_certificate) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, category, requires_certificate, default_wear_time_months',
      [i.name, i.category, i.unit, i.default_wear_time_months, i.seasonality, i.requires_certificate]);
    result.push(r.rows[0]);
  }
  return result;
};

const seedCertificates = async (itemTypes) => {
  const certs = [];
  for (const item of itemTypes) {
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + (item.requires_certificate ? 2 : 5));
    const cert = {
      product_name: item.name,
      certificate_number: item.requires_certificate ? `СERT-${item.id}-2025` : `ДОК-${item.id}-2025`,
      issue_date: item.requires_certificate ? '2024-01-15' : '2023-06-01',
      expiry_date: expiryDate.toISOString().split('T')[0],
      file_path: `/certs/${item.name.toLowerCase().replace(/ /g, '_')}.pdf`,
      item_type_id: item.id,
      status: 'active'
    };
    const r = await pool.query('INSERT INTO certificates (product_name, certificate_number, issue_date, expiry_date, file_path, item_type_id, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *', [cert.product_name, cert.certificate_number, cert.issue_date, cert.expiry_date, cert.file_path, cert.item_type_id, cert.status]);
    certs.push(r.rows[0]);
  }
  return certs;
};

const seedIssueNorms = async (itemTypes, sites) => {
  const norms = [];
  const positions = ['Наполнитель баллонов', 'Оператор АЗС', 'Старший оператор', 'Мастер АЗС', 'Кассир', 'Электрик', 'Сварщик', 'Заправщик'];
  const genders = ['male', 'female', null];
  for (const p of positions) {
    for (const g of genders) {
      for (const item of itemTypes) {
        const periodMonths = item.default_wear_time_months || 12;
        const quantity = item.category === 'consumable' ? 1 : 1;
        const etnPoint = 'п. ' + (100 + itemTypes.indexOf(item) + 1) + ' прил.1';
        const periodText = quantity + ' шт.' + (periodMonths === 1 ? ' в год' : ' в ' + periodMonths + ' мес.');
        const norm = await pool.query(
          'INSERT INTO issue_norms (item_type_id, period_months, quantity, gender, position, site_id, seasonality, etn_point, period_text) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
          [item.id, periodMonths, quantity, g, p, null, item.seasonality, etnPoint, periodText]
        );
        norms.push(norm.rows[0]);
      }
    }
  }
  return norms;
};

const seedIssueRecords = async (employees, itemTypes, certs) => {
  const createDate = (offsetDays) => {
    const d = new Date();
    d.setDate(d.getDate() - offsetDays);
    return d.toISOString().split('T')[0];
  };
  const records = [];
  for (const emp of employees) {
    for (const item of itemTypes) {
      const cert = certs.find(c => c.item_type_id === item.id);
      const issueDate = createDate(Math.floor(Math.random() * 180));
      const expiryDate = item.default_wear_time_months ? new Date(issueDate) : null;
      if (expiryDate) expiryDate.setMonth(expiryDate.getMonth() + item.default_wear_time_months);
      const record = await pool.query(
        'INSERT INTO issue_records (employee_id, item_type_id, quantity, issue_date, expiry_date, certificate_id, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
        [emp.id, item.id, 1, issueDate, expiryDate, cert?.id || null, 'issued']
      );
      records.push(record.rows[0]);
    }
  }
  return records;
};

const main = async () => {
  try {
    await clearAll();
    console.log('Cleared all data');
    
    const sites = await seedSites();
    console.log('Sites seeded:', sites.length);
    
    const employees = await seedEmployees(sites);
    console.log('Employees seeded:', employees.length);
    
    const itemTypes = await seedItemTypes();
    console.log('Item types seeded:', itemTypes.length);
    
    const certs = await seedCertificates(itemTypes);
    console.log('Certificates seeded:', certs.length);
    
    const norms = await seedIssueNorms(itemTypes, sites);
    console.log('Issue norms seeded:', norms.length);
    
    const records = await seedIssueRecords(employees, itemTypes, certs);
    console.log('Issue records seeded:', records.length);
    
    console.log('Seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

main();