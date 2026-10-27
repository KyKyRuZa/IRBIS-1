import pool from '../models/db.js'
import bcrypt from 'bcrypt'
import { childLogger } from '../utils/logger.js'
import { addMonthsClamped } from '../utils/date.js'

const log = childLogger('seed')

const RESET_FLAG = process.argv.includes('--reset')

const clearAll = async () => {
  await pool.query('DELETE FROM push_subscriptions')
  await pool.query('DELETE FROM form_taken')
  await pool.query('DELETE FROM forms')
  await pool.query('DELETE FROM notifications')
  await pool.query('DELETE FROM issue_records')
  await pool.query('DELETE FROM norm_template_items')
  await pool.query('DELETE FROM norm_templates')
  await pool.query('DELETE FROM issue_norms')
  await pool.query('DELETE FROM certificates')
  await pool.query('DELETE FROM employees')
  await pool.query('DELETE FROM item_types')
  await pool.query('DELETE FROM sites')
  await pool.query('DELETE FROM refresh_tokens')
}

const seedSites = async () => {
  const sites = [
    { name: 'АЗС IRBIS "Сибирский тракт"', responsible_person: 'Галиев Айрат Маратович' },
    { name: 'АЗС IRBIS "Победы"', responsible_person: 'Иванова Ольга Николаевна' },
    { name: 'АЗС IRBIS "Техническая"', responsible_person: 'Мухаметшин Рамиль Фаридович' },
  ]
  const result = []
  for (const s of sites) {
    const r = await pool.query(
      'INSERT INTO sites (name, responsible_person) VALUES ($1, $2) RETURNING *',
      [s.name, s.responsible_person]
    )
    result.push(r.rows[0])
  }
  return result
}

const seedEmployees = async (sites) => {
  const employees = [
    {
      full_name: 'Ахметов Ильдар Рамилевич',
      position: 'Мастер смены',
      site_id: sites[0].id,
      gender: 'male',
      hire_date: '2016-05-20',
      clothing_size: '52-54',
      shoe_size: '44',
      height: 182,
      personnel_number: 'МС-0001',
      hat_size: '58',
      respirator_size: 'L',
      gloves_size: '11',
      position_change_date: '2022-03-15',
    },
    {
      full_name: 'Кудряшова Елена Викторовна',
      position: 'Кассир-оператор',
      site_id: sites[0].id,
      gender: 'female',
      hire_date: '2019-08-12',
      clothing_size: '44-46',
      shoe_size: '37',
      height: 165,
      personnel_number: 'КО-0001',
      hat_size: '54',
      respirator_size: 'S',
      gloves_size: '8',
      position_change_date: null,
    },
    {
      full_name: 'Сафин Тимур Анварович',
      position: 'Оператор АЗС',
      site_id: sites[0].id,
      gender: 'male',
      hire_date: '2020-01-15',
      clothing_size: '48-50',
      shoe_size: '42',
      height: 178,
      personnel_number: 'ОП-0001',
      hat_size: '56',
      respirator_size: 'M',
      gloves_size: '9',
      position_change_date: null,
    },
    {
      full_name: 'Васильева Анна Сергеевна',
      position: 'Оператор АЗС',
      site_id: sites[0].id,
      gender: 'female',
      hire_date: '2021-06-01',
      clothing_size: '46-48',
      shoe_size: '38',
      height: 168,
      personnel_number: 'ОП-0002',
      hat_size: '55',
      respirator_size: 'S/M',
      gloves_size: '8',
      position_change_date: '2024-01-10',
    },
    {
      full_name: 'Гараев Марат Ильдарович',
      position: 'Наполнитель баллонов',
      site_id: sites[0].id,
      gender: 'male',
      hire_date: '2018-11-05',
      clothing_size: '50-52',
      shoe_size: '43',
      height: 180,
      personnel_number: 'НБ-0001',
      hat_size: '57',
      respirator_size: 'L',
      gloves_size: '10',
      position_change_date: null,
    },
    {
      full_name: 'Хабибуллина Динара Рустамовна',
      position: 'Кассир-оператор',
      site_id: sites[1].id,
      gender: 'female',
      hire_date: '2020-03-10',
      clothing_size: '44-46',
      shoe_size: '36',
      height: 162,
      personnel_number: 'КО-0002',
      hat_size: '54',
      respirator_size: 'S',
      gloves_size: '7',
      position_change_date: null,
    },
    {
      full_name: 'Ибрагимов Руслан Наилевич',
      position: 'Мастер смены',
      site_id: sites[1].id,
      gender: 'male',
      hire_date: '2017-09-12',
      clothing_size: '50-52',
      shoe_size: '43',
      height: 181,
      personnel_number: 'МС-0002',
      hat_size: '57',
      respirator_size: 'L',
      gloves_size: '10',
      position_change_date: '2023-05-20',
    },
    {
      full_name: 'Султанова Гульназ Фанисовна',
      position: 'Оператор АЗС',
      site_id: sites[1].id,
      gender: 'female',
      hire_date: '2022-02-14',
      clothing_size: '44-46',
      shoe_size: '37',
      height: 164,
      personnel_number: 'ОП-0003',
      hat_size: '54',
      respirator_size: 'S',
      gloves_size: '8',
      position_change_date: null,
    },
    {
      full_name: 'Фатыхова Лилия Рашидовна',
      position: 'Учетчик ГСМ',
      site_id: sites[1].id,
      gender: 'female',
      hire_date: '2019-07-22',
      clothing_size: '46-48',
      shoe_size: '37',
      height: 163,
      personnel_number: 'УГ-0001',
      hat_size: '54',
      respirator_size: 'S',
      gloves_size: '8',
      position_change_date: null,
    },
    {
      full_name: 'Закиров Игорь Венерович',
      position: 'Заправщик',
      site_id: sites[2].id,
      gender: 'male',
      hire_date: '2021-04-01',
      clothing_size: '48-50',
      shoe_size: '42',
      height: 176,
      personnel_number: 'ЗА-0001',
      hat_size: '56',
      respirator_size: 'M',
      gloves_size: '9',
      position_change_date: null,
    },
    {
      full_name: 'Миннегалиева Айгуль Рафаэлевна',
      position: 'Кассир-оператор',
      site_id: sites[2].id,
      gender: 'female',
      hire_date: '2023-03-10',
      clothing_size: '44-46',
      shoe_size: '36',
      height: 160,
      personnel_number: 'КО-0003',
      hat_size: '54',
      respirator_size: 'S',
      gloves_size: '7',
      position_change_date: null,
    },
    {
      full_name: 'Нуруллин Алмаз Маратович',
      position: 'Оператор АЗС',
      site_id: sites[2].id,
      gender: 'male',
      hire_date: '2020-08-01',
      clothing_size: '50-52',
      shoe_size: '43',
      height: 183,
      personnel_number: 'ОП-0004',
      hat_size: '57',
      respirator_size: 'L',
      gloves_size: '11',
      position_change_date: '2024-06-01',
    },
    {
      full_name: 'Яковлев Дмитрий Андреевич',
      position: 'Электрик',
      site_id: sites[2].id,
      gender: 'male',
      hire_date: '2018-05-15',
      clothing_size: '52-54',
      shoe_size: '44',
      height: 182,
      personnel_number: 'ЭЛ-0001',
      hat_size: '58',
      respirator_size: 'L',
      gloves_size: '11',
      position_change_date: null,
    },
    {
      full_name: 'Петрова Светлана Юрьевна',
      position: 'Сварщик',
      site_id: sites[2].id,
      gender: 'female',
      hire_date: '2019-07-22',
      clothing_size: '46-48',
      shoe_size: '37',
      height: 163,
      personnel_number: 'СВ-0001',
      hat_size: '54',
      respirator_size: 'S',
      gloves_size: '8',
      position_change_date: null,
    },
  ]
  const result = []
  for (const e of employees) {
    const r = await pool.query(
      `INSERT INTO employees 
      (full_name, position, site_id, gender, hire_date, clothing_size, shoe_size, height, personnel_number, hat_size, respirator_size, gloves_size, position_change_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
      [
        e.full_name,
        e.position,
        e.site_id,
        e.gender,
        e.hire_date,
        e.clothing_size,
        e.shoe_size,
        e.height,
        e.personnel_number,
        e.hat_size,
        e.respirator_size,
        e.gloves_size,
        e.position_change_date,
      ]
    )
    result.push(r.rows[0])
  }
  await pool.query("UPDATE employees SET status='terminated' WHERE id=$1", [result[4].id])
  return result
}

const seedItemTypes = async () => {
  const items = [
    {
      name: 'Костюм хлопчатобумажный с МВО пропиткой',
      category: 'clothing',
      unit: 'комплект',
      default_wear_time_months: 24,
      seasonality: 'year_round',
      requires_certificate: false,
    },
    {
      name: 'Фартук прорезиненный с нагрудником',
      category: 'clothing',
      unit: 'шт',
      default_wear_time_months: 12,
      seasonality: 'year_round',
      requires_certificate: false,
    },
    {
      name: 'Костюм зимний на утепляющей прокладке',
      category: 'clothing',
      unit: 'комплект',
      default_wear_time_months: 36,
      seasonality: 'winter',
      requires_certificate: false,
    },
    {
      name: 'Куртка на утепляющей прокладке',
      category: 'clothing',
      unit: 'шт',
      default_wear_time_months: 36,
      seasonality: 'winter',
      requires_certificate: false,
    },
    {
      name: 'Сапоги резиновые маслобензостойкие',
      category: 'footwear',
      unit: 'пара',
      default_wear_time_months: 12,
      seasonality: 'year_round',
      requires_certificate: false,
    },
    {
      name: 'Ботинки кожаные с МБС подошвой',
      category: 'footwear',
      unit: 'пара',
      default_wear_time_months: 24,
      seasonality: 'year_round',
      requires_certificate: false,
    },
    {
      name: 'Валенки с резиновым низом',
      category: 'footwear',
      unit: 'пара',
      default_wear_time_months: 36,
      seasonality: 'winter',
      requires_certificate: false,
    },
    {
      name: 'Каска защитная',
      category: 'siz',
      unit: 'шт',
      default_wear_time_months: 24,
      seasonality: 'year_round',
      requires_certificate: true,
    },
    {
      name: 'Очки защитные открытые',
      category: 'siz',
      unit: 'шт',
      default_wear_time_months: 12,
      seasonality: 'year_round',
      requires_certificate: true,
    },
    {
      name: 'Респиратор FFP2',
      category: 'siz',
      unit: 'шт',
      default_wear_time_months: 1,
      seasonality: 'year_round',
      requires_certificate: true,
    },
    {
      name: 'Перчатки маслобензостойкие',
      category: 'siz',
      unit: 'пара',
      default_wear_time_months: 1,
      seasonality: 'year_round',
      requires_certificate: false,
    },
    {
      name: 'Перчатки нитриловые',
      category: 'siz',
      unit: 'пара',
      default_wear_time_months: 1,
      seasonality: 'year_round',
      requires_certificate: false,
    },
    {
      name: 'Перчатки комбинированные',
      category: 'siz',
      unit: 'пара',
      default_wear_time_months: 1,
      seasonality: 'year_round',
      requires_certificate: false,
    },
    {
      name: 'Крем для рук защитный',
      category: 'consumable',
      unit: 'туба',
      default_wear_time_months: 1,
      seasonality: 'year_round',
      requires_certificate: false,
    },
    {
      name: 'Мыло жидкое хозяйственное',
      category: 'consumable',
      unit: 'флакон',
      default_wear_time_months: 1,
      seasonality: 'year_round',
      requires_certificate: false,
    },
  ]
  const result = []
  for (const i of items) {
    const r = await pool.query(
      'INSERT INTO item_types (name, category, unit, default_wear_time_months, seasonality, requires_certificate) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [
        i.name,
        i.category,
        i.unit,
        i.default_wear_time_months,
        i.seasonality,
        i.requires_certificate,
      ]
    )
    result.push(r.rows[0])
  }
  return result
}

const CERT_FILE_MAP = {
  'Каска защитная': 'каска.pdf',
  'Очки защитные открытые': 'очки_защитные.pdf',
  'Респиратор FFP2': 'респиратор_ffp2.pdf',
  'Костюм хлопчатобумочный с МВО пропиткой': 'костюм_хлопчатобумочный.pdf',
  'Ботинки кожаные с МБС подошвой': 'ботинки_кожаные.pdf',
  'Сапоги резиновые маслобензостойкие': 'сапоги_резиновые.pdf',
  'Куртка на утепляющей прокладке': 'куртка_зимняя.pdf',
  'Костюм зимний на утепляющей прокладке': 'куртка_зимняя.pdf',
  'Крем для рук защитный': 'крем_для_рук.pdf',
  'Мыло жидкое хозяйственное': 'мыло_жидкое.pdf',
  'Перчатки нитриловые': 'перчатки_нитриловые.pdf',
}

const certFilePath = (itemName) => {
  const mapped = CERT_FILE_MAP[itemName]
  if (mapped) return `/certs/${mapped}`
  return `/certs/${itemName.toLowerCase().replace(/[^a-zа-яё0-9]/g, '_')}.pdf`
}

const seedCertificates = async (itemTypes) => {
  const certs = []
  for (const item of itemTypes) {
    if (item.requires_certificate) {
      const base = new Date()
      const issueDate = new Date(base)
      issueDate.setFullYear(issueDate.getFullYear() - 1)
      const expiryDate = new Date(issueDate)
      expiryDate.setFullYear(expiryDate.getFullYear() + 2)
      const cert = {
        product_name: item.name,
        certificate_number: `ТР ТС 019/2011-${String(item.id).padStart(4, '0')}-2025`,
        issue_date: issueDate.toISOString().split('T')[0],
        expiry_date: expiryDate.toISOString().split('T')[0],
        file_path: certFilePath(item.name),
        item_type_id: item.id,
        status: 'active',
      }
      const r = await pool.query(
        'INSERT INTO certificates (product_name, certificate_number, issue_date, expiry_date, file_path, item_type_id, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
        [
          cert.product_name,
          cert.certificate_number,
          cert.issue_date,
          cert.expiry_date,
          cert.file_path,
          cert.item_type_id,
          cert.status,
        ]
      )
      certs.push(r.rows[0])
    } else {
      const issueDate = new Date()
      issueDate.setFullYear(issueDate.getFullYear() - 2)
      const expiryDate = new Date(issueDate)
      expiryDate.setFullYear(expiryDate.getFullYear() + 3)
      const cert = {
        product_name: item.name,
        certificate_number: `ДЕКЛ-${String(item.id).padStart(4, '0')}-2023`,
        issue_date: issueDate.toISOString().split('T')[0],
        expiry_date: expiryDate.toISOString().split('T')[0],
        file_path: certFilePath(item.name),
        item_type_id: item.id,
        status: 'active',
      }
      const r = await pool.query(
        'INSERT INTO certificates (product_name, certificate_number, issue_date, expiry_date, file_path, item_type_id, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
        [
          cert.product_name,
          cert.certificate_number,
          cert.issue_date,
          cert.expiry_date,
          cert.file_path,
          cert.item_type_id,
          cert.status,
        ]
      )
      certs.push(r.rows[0])
    }
  }
  const expiredItem = itemTypes.find((i) => i.category === 'siz')
  if (expiredItem) {
    const issueDate = new Date()
    issueDate.setFullYear(issueDate.getFullYear() - 3)
    const expiryDate = new Date(issueDate)
    expiryDate.setFullYear(expiryDate.getFullYear() + 1)
    expiryDate.setMonth(expiryDate.getMonth() - 2)
    const r = await pool.query(
      'INSERT INTO certificates (product_name, certificate_number, issue_date, expiry_date, file_path, item_type_id, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
       [
         expiredItem.name,
         `EXP-${expiredItem.id}-2022`,
         issueDate.toISOString().split('T')[0],
         expiryDate.toISOString().split('T')[0],
         '/certs/куртка_зимняя_expired.pdf',
         expiredItem.id,
         'expired',
       ]
    )
    certs.push(r.rows[0])
  }
  return certs
}

const seedNormTemplates = async (itemTypes) => {
  const templates = []

  const getItem = (name) => itemTypes.find((i) => i.name === name)

  const templatesData = [
    {
      name: 'Оperator АЗС',
      position: 'Оператор АЗС',
      items: [
        { itemType: getItem('Каска защитная'), period_months: 24, quantity: 1 },
        { itemType: getItem('Очки защитные открытые'), period_months: 12, quantity: 1 },
        { itemType: getItem('Респиратор FFP2'), period_months: 1, quantity: 1 },
        { itemType: getItem('Перчатки маслобензостойкие'), period_months: 1, quantity: 1 },
        { itemType: getItem('Крем для рук защитный'), period_months: 1, quantity: 1 },
        { itemType: getItem('Мыло жидкое хозяйственное'), period_months: 1, quantity: 1 },
      ],
    },
    {
      name: 'Наполнитель баллонов',
      position: 'Наполнитель баллонов',
      items: [
        { itemType: getItem('Каска защитная'), period_months: 24, quantity: 1 },
        { itemType: getItem('Очки защитные открытые'), period_months: 12, quantity: 1 },
        { itemType: getItem('Респиратор FFP2'), period_months: 1, quantity: 1 },
        { itemType: getItem('Перчатки маслобензостойкие'), period_months: 1, quantity: 1 },
      ],
    },
  ]

  for (const t of templatesData) {
    const normItem = t.items.find((i) => i.itemType !== undefined)
    if (!normItem) continue

    const tRes = await pool.query(
      'INSERT INTO norm_templates (name, position, site_id, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW()) RETURNING *',
      [t.name, t.position, null]
    )
    const template = tRes.rows[0]
    template.items = []

    for (const item of t.items) {
      if (!item.itemType) continue
      const periodText =
        item.quantity +
        ' ' +
        item.itemType.unit +
        (item.period_months === 1 ? ' в год' : ' в ' + item.period_months + ' мес.')
      const etnPoint = 'п. ' + (100 + itemTypes.indexOf(item.itemType) + 1) + ' прил.1'
      const r = await pool.query(
        'INSERT INTO norm_template_items (template_id, item_type_id, period_months, quantity, etn_point, period_text, seasonality) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
        [template.id, item.itemType.id, item.period_months, item.quantity, etnPoint, periodText, item.itemType.seasonality]
      )
      const fullItem = { ...r.rows[0], item_type_name: item.itemType.name, category: item.itemType.category }
      template.items.push(fullItem)
    }
    template.itemCount = template.items.length
    delete template.items
    templates.push(template)
  }

  return templates
}

const seedIssueNorms = async (itemTypes) => {
  const norms = []
  const positions = [
    'Мастер смены',
    'Кассир-оператор',
    'Оператор АЗС',
    'Наполнитель баллонов',
    'Заправщик',
    'Учетчик ГСМ',
    'Электрик',
    'Сварщик',
  ]
  const genders = ['male', 'female']
  for (const p of positions) {
    for (const g of genders) {
      for (const item of itemTypes) {
        const periodMonths = item.default_wear_time_months || 12
        const quantity = item.category === 'consumable' ? 1 : 1
        const etnPoint = 'п. ' + (100 + itemTypes.indexOf(item) + 1) + ' прил.1'
        const periodText =
          quantity +
          ' ' +
          item.unit +
          (periodMonths === 1 ? ' в год' : ' в ' + periodMonths + ' мес.')
        const norm = await pool.query(
          'INSERT INTO issue_norms (item_type_id, period_months, quantity, gender, position, site_id, seasonality, etn_point, period_text) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
          [item.id, periodMonths, quantity, g, p, null, item.seasonality, etnPoint, periodText]
        )
        norms.push(norm.rows[0])
      }
    }
  }
  return norms
}

const seedIssueRecords = async (employees, itemTypes, certs) => {
  const createDate = (offsetDays) => {
    const d = new Date()
    d.setDate(d.getDate() - offsetDays)
    return d.toISOString().split('T')[0]
  }
  const records = []
  const statuses = ['issued', 'issued', 'issued', 'returned', 'disposed', 'due_for_disposal']
  const methods = ['personal', 'personal', 'personal', 'dosator', 'personal']
  for (let i = 0; i < employees.length; i++) {
    const emp = employees[i]
    for (let j = 0; j < itemTypes.length; j++) {
      const item = itemTypes[j]
      const cert = certs.find((c) => c.item_type_id === item.id)
      const issueDate = createDate(Math.floor(Math.random() * 180) + 1)
      let expiryDate = null
      if (item.default_wear_time_months) {
        expiryDate = addMonthsClamped(issueDate, item.default_wear_time_months)
      }
      const status = statuses[Math.floor(Math.random() * statuses.length)]
      const returnDate = status === 'returned' ? createDate(Math.floor(Math.random() * 30)) : null
      const returnQuantity = status === 'returned' ? 1 : 0
      const method = methods[Math.floor(Math.random() * methods.length)]
      const reorderDate = expiryDate ? addMonthsClamped(expiryDate, -2) : null
      const notesMap = {
        personal: 'Выдано по норме (лично выдача)',
        dosator: 'Выдано по норме (дозатор)',
      }
      const record = await pool.query(
        'INSERT INTO issue_records (employee_id, item_type_id, quantity, issue_date, expiry_date, certificate_id, status, return_date, return_quantity, issue_method, reorder_date, notes, write_off_act) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *',
        [
          emp.id,
          item.id,
          1,
          issueDate,
          expiryDate ? expiryDate.toISOString().split('T')[0] : null,
          cert?.id || null,
          status,
          returnDate,
          returnQuantity,
          method,
          reorderDate ? reorderDate.toISOString().split('T')[0] : null,
          notesMap[method],
          null,
        ]
      )
      records.push(record.rows[0])
    }
  }
  return records
}

const seedForms = async (employees) => {
  const forms = []
  const formDefs = [
    {
      name: 'Инструктаж по пожарной безопасности',
      description: 'Ежегодный инструктаж для персонала АЗС',
    },
    { name: 'Инструктаж по охране труда', description: 'Первичный и повторный инструктаж' },
    {
      name: 'Инструктаж по электробезопасности',
      description: 'Для персонала, работающего с электрооборудованием',
    },
    { name: 'Акт о допуске к работе', description: 'Допуск к работе на АЗС' },
    {
      name: 'Инструктаж по оказанию первой помощи',
      description: 'Первичная помощь при травмах и отравлениях',
    },
  ]
  for (const f of formDefs) {
    const r = await pool.query(
      'INSERT INTO forms (name, description) VALUES ($1, $2) RETURNING *',
      [f.name, f.description]
    )
    forms.push(r.rows[0])
  }
  const formTaken = []
  for (const form of forms) {
    const emp = employees[Math.floor(Math.random() * employees.length)]
    const takenAt = new Date()
    takenAt.setDate(takenAt.getDate() - Math.floor(Math.random() * 90))
    const r = await pool.query(
      'INSERT INTO form_taken (form_id, employee_id, taken_at) VALUES ($1, $2, $3) RETURNING *',
      [form.id, emp.id, takenAt.toISOString().split('T')[0]]
    )
    formTaken.push(r.rows[0])
  }
  return { forms, formTaken }
}

const seedNotifications = async (employees) => {
  const notifications = []
  const types = ['certificate_expiry', 'ppe_due', 'medical_exam', 'training']
  const severities = ['info', 'warning', 'danger']
  const messages = [
    'Сертификат на респиратор FFP2 истекает через 30 дней',
    'Срок носки спецкостюма истёк, требуется замена',
    'Предстоящий плановый медицинский осмотр',
    'Необходимо пройти повторный инструктаж по охране труда',
    'Сертификат на каску истекает через 15 дней',
    'Срок носки сапог резиновых истёк',
    'Предстоящая проверка знаний по электробезопасности',
    'Требуется замена изношенных перчаток маслобензостойких',
  ]
  for (let i = 0; i < 20; i++) {
    const emp = employees[Math.floor(Math.random() * employees.length)]
    const type = types[Math.floor(Math.random() * types.length)]
    const severity = severities[Math.floor(Math.random() * severities.length)]
    const message = messages[Math.floor(Math.random() * messages.length)]
    const date = new Date()
    date.setDate(date.getDate() - Math.floor(Math.random() * 60))
    const r = await pool.query(
      'INSERT INTO notifications (notification_id, type, severity, message, employee_id, site_id, date, read) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [
        `notif-${Date.now()}-${i}`,
        type,
        severity,
        message,
        emp.id,
        emp.site_id,
        date.toISOString().split('T')[0],
        Math.random() > 0.5,
      ]
    )
    notifications.push(r.rows[0])
  }
  return notifications
}

const seedPushSubscriptions = async (employees) => {
  const subscriptions = []
  for (const emp of employees.slice(0, 5)) {
    const username = 'employee' + emp.id
    const passwordHash = await bcrypt.hash('password', 10)
    const u = await pool.query(
      'INSERT INTO users (username, password_hash, role, push_enabled) VALUES ($1, $2, $3, $4) ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash, push_enabled = EXCLUDED.push_enabled RETURNING id',
      [username, passwordHash, 'user', true]
    )
    const userId = u.rows[0].id
    await pool.query('UPDATE employees SET user_id = $1 WHERE id = $2', [userId, emp.id])
    const r = await pool.query(
      'INSERT INTO push_subscriptions (user_id, employee_id, endpoint, p256dh, auth, user_agent) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [
        userId,
        emp.id,
        `https://fcm.googleapis.com/fcm/send/${emp.id}`,
        `p256dh_${emp.id}`,
        `auth_${emp.id}`,
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      ]
    )
    subscriptions.push(r.rows[0])
  }
  return subscriptions
}

const seedUsers = async () => {
  const existing = await pool.query('SELECT id FROM users WHERE username = $1', ['admin'])
  if (existing.rows.length > 0) {
    log.info('Admin user already exists')
    return existing.rows[0]
  }
  const passwordHash = await bcrypt.hash('admin', 10)
  const result = await pool.query(
    'INSERT INTO users (username, password_hash, role, push_enabled) VALUES ($1, $2, $3, $4) RETURNING *',
    ['admin', passwordHash, 'admin', true]
  )
  log.info('Admin user created')
  return result.rows[0]
}

const assignEmployeeTemplates = async (employees, templates) => {
  const templatesByPosition = {}
  for (const t of templates) {
    if (!templatesByPosition[t.position]) templatesByPosition[t.position] = []
    templatesByPosition[t.position].push(t)
  }
  for (const emp of employees) {
    const candidates = templatesByPosition[emp.position] || []
    if (candidates.length > 0) {
      await pool.query('UPDATE employees SET template_id = $1 WHERE id = $2', [candidates[0].id, emp.id])
    }
  }
}

const main = async () => {
  try {
    const existing = await pool.query('SELECT COUNT(*)::int FROM sites')
    if (existing.rows[0].count > 0 && !RESET_FLAG) {
      log.info('Database already seeded; skipping. Use --reset to reseed.')
      process.exit(0)
    }

    if (RESET_FLAG) {
      await clearAll()
      log.info('Cleared all data')
    }

    const sites = await seedSites()
    log.info({ count: sites.length }, 'Sites seeded')

    const itemTypes = await seedItemTypes()
    log.info({ count: itemTypes.length }, 'Item types seeded')

    const templates = await seedNormTemplates(itemTypes)
    log.info({ count: templates.length }, 'Norm templates seeded')

    const employees = await seedEmployees(sites)
    log.info({ count: employees.length }, 'Employees seeded')

    await assignEmployeeTemplates(employees, templates)
    log.info('Employee norm templates assigned')

    const certs = await seedCertificates(itemTypes)
    log.info({ count: certs.length }, 'Certificates seeded')

    const norms = await seedIssueNorms(itemTypes)
    log.info({ count: norms.length }, 'Issue norms seeded')

    const records = await seedIssueRecords(employees, itemTypes, certs)
    log.info({ count: records.length }, 'Issue records seeded')

    const { forms, formTaken } = await seedForms(employees)
    log.info({ forms: forms.length, formTaken: formTaken.length }, 'Forms seeded')

    const notifications = await seedNotifications(employees)
    log.info({ count: notifications.length }, 'Notifications seeded')

    const subscriptions = await seedPushSubscriptions(employees)
    log.info({ count: subscriptions.length }, 'Push subscriptions seeded')

    const user = await seedUsers()
    log.info({ username: user.username }, 'Users seeded')

    log.info('Seeding completed successfully')
    process.exit(0)
  } catch (error) {
    log.error(error, 'Seeding failed')
    process.exit(1)
  }
}

main()
