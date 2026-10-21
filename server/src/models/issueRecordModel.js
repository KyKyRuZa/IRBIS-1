import pool from './db.js'

function badRequest(message) {
  const error = new Error(message)
  error.status = 400
  return error
}

// Номер листа выдачи в карточке: титульный лист = 1, поэтому к количеству
// различных дат выдачи сотрудника в этом календарном году до текущей даты
// прибавляется 1. С января нумерация начинается заново.
//
// Использует correlated subquery (COUNT DISTINCT). Window function с DISTINCT
// не поддерживается PostgreSQL для агрегатов-оконных функций, поэтому
// оптимизация до CTE с предвычислением требует рефакторинга запросов.
export const SHEET_NUMBER_SELECT = `
  (SELECT COUNT(DISTINCT r2.issue_date)::int + 1
      FROM issue_records r2
     WHERE r2.employee_id = r.employee_id
       AND EXTRACT(YEAR FROM r2.issue_date) = EXTRACT(YEAR FROM r.issue_date)
       AND r2.issue_date <= r.issue_date) AS sheet_number
  `

async function calculateExpiryAndReorder(issueDate, wearTime, _itemTypeId) {
  const effectiveWear = wearTime ? Number(wearTime) : null
  let expiryDate = null
  let reorderDate = null
  if (effectiveWear && issueDate) {
    expiryDate = new Date(issueDate)
    expiryDate.setMonth(expiryDate.getMonth() + effectiveWear)
    expiryDate = expiryDate.toISOString().split('T')[0]
    const reorder = new Date(expiryDate)
    reorder.setMonth(reorder.getMonth() - 2)
    reorderDate = reorder.toISOString().split('T')[0]
  }
  return { expiryDate, reorderDate }
}

export async function createIssueRecord(
  employeeId,
  itemTypeId,
  quantity,
  issueDate,
  expiryDate,
  certificateId,
  reorderDate,
  wearTimeOverride,
  notes,
  issueMethod,
  signaturePath,
  signatureDate,
  writeOffAct
) {
  const result = await pool.query(
    `INSERT INTO issue_records (employee_id, item_type_id, quantity, issue_date, expiry_date, certificate_id, reorder_date, wear_time_override_months, notes, issue_method, signature_path, signature_date, write_off_act) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
    [
      employeeId,
      itemTypeId,
      quantity,
      issueDate,
      expiryDate,
      certificateId,
      reorderDate,
      wearTimeOverride,
      notes,
      issueMethod,
      signaturePath,
      signatureDate,
      writeOffAct || null,
    ]
  )
  return result.rows[0]
}

export async function getAllIssueRecords() {
  const result = await pool.query(`
    SELECT r.*, e.full_name, e.position, e.site_id, it.name as item_type_name, it.category, c.certificate_number,
      ${SHEET_NUMBER_SELECT}
    FROM issue_records r
    JOIN employees e ON r.employee_id = e.id
    JOIN item_types it ON r.item_type_id = it.id
    LEFT JOIN certificates c ON r.certificate_id = c.id
    ORDER BY r.issue_date DESC
  `)
  return result.rows
}

export async function getIssueRecordsByEmployee(employeeId) {
  const result = await pool.query(
    `
    SELECT r.*, it.name as item_type_name, it.category, it.unit, c.certificate_number,
      ${SHEET_NUMBER_SELECT}
    FROM issue_records r
    JOIN item_types it ON r.item_type_id = it.id
    LEFT JOIN certificates c ON r.certificate_id = c.id
    WHERE r.employee_id = $1
    ORDER BY r.issue_date DESC
  `,
    [employeeId]
  )
  return result.rows
}

// Позиции одной выдачи (события) — всё, что выдано сотруднику в одну дату.
// Лист выдачи печатается по событию и содержит только эти позиции.
export async function getIssueRecordsForEvent(employeeId, issueDate) {
  const result = await pool.query(
    `
    SELECT r.*, it.name as item_type_name, it.category, it.unit, c.certificate_number
    FROM issue_records r
    JOIN item_types it ON r.item_type_id = it.id
    LEFT JOIN certificates c ON r.certificate_id = c.id
    WHERE r.employee_id = $1 AND r.issue_date = $2
    ORDER BY r.id ASC
  `,
    [employeeId, issueDate]
  )
  return result.rows
}

// События выдачи сотрудника за календарный год с номерами листов.
// Титульный лист = 1, поэтому первая выдача года — лист 2; с января нумерация сбрасывается.
export async function getIssueEventsByEmployee(employeeId, year) {
  const result = await pool.query(
    `
    SELECT r.*, it.name as item_type_name, it.category, it.unit, c.certificate_number
    FROM issue_records r
    JOIN item_types it ON r.item_type_id = it.id
    LEFT JOIN certificates c ON r.certificate_id = c.id
    WHERE r.employee_id = $1 AND EXTRACT(YEAR FROM r.issue_date) = $2
    ORDER BY r.issue_date ASC, r.id ASC
  `,
    [employeeId, year]
  )

  const events = []
  const byDate = new Map()
  for (const row of result.rows) {
    const key = new Date(row.issue_date).toISOString().slice(0, 10)
    if (!byDate.has(key)) {
      const event = { issue_date: key, sheetNumber: events.length + 2, items: [] }
      byDate.set(key, event)
      events.push(event)
    }
    byDate.get(key).items.push(row)
  }
  return events
}

// Номер листа выдачи в карточке: титульный лист = 1, поэтому первая выдача
// календарного года — лист 2. С января нумерация сбрасывается.
export async function getIssueSheetNumber(employeeId, issueDate) {
  const result = await pool.query(
    `
    SELECT COUNT(DISTINCT r2.issue_date)::int + 1 AS sheet_number
    FROM issue_records r2
    WHERE r2.employee_id = $1
      AND EXTRACT(YEAR FROM r2.issue_date) = EXTRACT(YEAR FROM $2::date)
      AND r2.issue_date <= $2::date
  `,
    [employeeId, issueDate]
  )
  return Number(result.rows[0]?.sheet_number || 2)
}

// Сотрудники, у которых есть выдача в указанную дату (для групповой печати листов).
export async function getEmployeesWithIssueOnDate(
  issueDate,
  { position = null, siteId = null } = {}
) {
  const result = await pool.query(
    `
    SELECT DISTINCT e.*, s.name as site_name, s.responsible_person as site_responsible
    FROM issue_records r
    JOIN employees e ON r.employee_id = e.id
    LEFT JOIN sites s ON e.site_id = s.id
    WHERE r.issue_date = $1
      AND ($2::text IS NULL OR e.position = $2)
      AND ($3::int IS NULL OR e.site_id = $3)
    ORDER BY e.full_name
  `,
    [issueDate, position, siteId]
  )
  return result.rows
}

// Самая свежая дата выдачи среди отфильтрованных записей — по умолчанию
// групповая печать берёт последнюю выдачу («только что выдала и печатаю листочки»).
export async function getLatestIssueDate({ position = null, siteId = null } = {}) {
  const result = await pool.query(
    `
    SELECT MAX(r.issue_date) as issue_date
    FROM issue_records r
    JOIN employees e ON r.employee_id = e.id
    WHERE ($1::text IS NULL OR e.position = $1)
      AND ($2::int IS NULL OR e.site_id = $2)
  `,
    [position, siteId]
  )
  return result.rows[0]?.issue_date
    ? new Date(result.rows[0].issue_date).toISOString().slice(0, 10)
    : null
}

export async function getIssueRecordsBySite(siteId) {
  const result = await pool.query(
    `
    SELECT r.*, e.full_name, e.position, it.name as item_type_name, it.category
    FROM issue_records r
    JOIN employees e ON r.employee_id = e.id
    JOIN item_types it ON r.item_type_id = it.id
    WHERE e.site_id = $1
    ORDER BY r.issue_date DESC
  `,
    [siteId]
  )
  return result.rows
}

export async function disposeIssueRecord(id) {
  const result = await pool.query(
    "UPDATE issue_records SET status='disposed' WHERE id=$1 RETURNING *",
    [id]
  )
  return result.rows[0]
}

export async function returnIssueRecord(id, returnDate, returnQuantity, status = 'returned') {
  const result = await pool.query(
    'UPDATE issue_records SET status=$1, return_date=$2, return_quantity=$3 WHERE id=$4 RETURNING *',
    [status, returnDate, returnQuantity, id]
  )
  return result.rows[0]
}

export async function returnIssueRecordAtomic(id, returnDate, returnQty) {
  const result = await pool.query(
    `
    UPDATE issue_records
    SET status = CASE
          WHEN (return_quantity + $1) >= quantity THEN 'returned'
          ELSE 'issued'
        END,
        return_date = $2,
        return_quantity = return_quantity + $1
    WHERE id = $3
      AND status IN ('issued', 'due_for_disposal')
      AND (return_quantity + $1) <= quantity
    RETURNING *
  `,
    [returnQty, returnDate, id]
  )
  return result.rows[0]
}

export async function deleteIssueRecord(id) {
  const result = await pool.query('DELETE FROM issue_records WHERE id=$1 RETURNING id', [id])
  return result.rows[0] || null
}

export async function batchIssueRecords(records) {
  const result = await pool.query(
    `INSERT INTO issue_records (employee_id, item_type_id, quantity, issue_date, expiry_date, certificate_id, reorder_date, wear_time_override_months, notes, issue_method, write_off_act)
     SELECT * FROM UNNEST($1::int[], $2::int[], $3::int[], $4::date[], $5::date[], $6::int[], $7::date[], $8::int[], $9::text[], $10::text[], $11::text[]) RETURNING *`,
    [
      records.map((r) => r.employee_id),
      records.map((r) => r.item_type_id),
      records.map((r) => r.quantity),
      records.map((r) => r.issue_date),
      records.map((r) => r.expiry_date),
      records.map((r) => r.certificate_id),
      records.map((r) => r.reorder_date),
      records.map((r) => r.wear_time_override),
      records.map((r) => r.notes || null),
      records.map((r) => r.issue_method || null),
      records.map((r) => r.write_off_act || null),
    ]
  )
  return result.rows
}

export async function getExpiringItems(monthsAhead = 2) {
  const result = await pool.query(
    `
    SELECT r.*, e.full_name, it.name as item_type_name, it.category
    FROM issue_records r
    JOIN employees e ON r.employee_id = e.id
    JOIN item_types it ON r.item_type_id = it.id
    WHERE r.expiry_date <= NOW() + make_interval(months => $1)
      AND r.status = 'issued'
    ORDER BY r.expiry_date
  `,
    [monthsAhead]
  )
  return result.rows
}

export async function getIssueRecordById(id) {
  const result = await pool.query(
    `
    SELECT r.*, e.full_name, e.position, e.site_id, it.name as item_type_name, it.category, c.certificate_number
    FROM issue_records r
    JOIN employees e ON r.employee_id = e.id
    JOIN item_types it ON r.item_type_id = it.id
    LEFT JOIN certificates c ON r.certificate_id = c.id
    WHERE r.id = $1
  `,
    [id]
  )
  return result.rows[0]
}

export async function updateIssueRecord(id, data) {
  const current = await getIssueRecordById(id)
  if (!current) return null

  const patch = {}
  const whitelist = [
    'employee_id',
    'item_type_id',
    'quantity',
    'issue_date',
    'expiry_date',
    'certificate_id',
    'notes',
    'issue_method',
    'write_off_act',
  ]
  const allowedStatuses = ['issued', 'disposed', 'returned', 'due_for_disposal']
  for (const key of whitelist) {
    if (Object.prototype.hasOwnProperty.call(data, key)) patch[key] = data[key]
  }
  if (Object.prototype.hasOwnProperty.call(data, 'status')) {
    const s = String(data.status).toLowerCase()
    if (!allowedStatuses.includes(s)) {
      throw badRequest(`Недопустимый статус: ${data.status}`)
    }
    patch.status = s
  }
  // The API sends `wear_time_override`; the column is `wear_time_override_months`.
  if (Object.prototype.hasOwnProperty.call(data, 'wear_time_override')) {
    patch.wear_time_override_months = data.wear_time_override
  }

  if (Object.prototype.hasOwnProperty.call(patch, 'employee_id')) {
    if (patch.employee_id === '' || patch.employee_id == null)
      throw badRequest('Некорректный сотрудник')
    const emp = await pool.query('SELECT id FROM employees WHERE id=$1', [patch.employee_id])
    if (!emp.rows[0]) throw badRequest('Сотрудник не найден')
  }
  if (Object.prototype.hasOwnProperty.call(patch, 'item_type_id')) {
    const item = await pool.query('SELECT * FROM item_types WHERE id=$1', [patch.item_type_id])
    if (!item.rows[0]) throw badRequest('Позиция не найдена')
  }
  if (Object.prototype.hasOwnProperty.call(patch, 'quantity')) {
    const parsed = Number(patch.quantity)
    if (!Number.isInteger(parsed) || parsed <= 0)
      throw badRequest('Количество должно быть целым и больше 0')
    patch.quantity = parsed
  }

  const itemTypeId = patch.item_type_id ?? current.item_type_id
  const wearTime = patch.wear_time_override_months ?? current.wear_time_override_months
  if (wearTime !== null && wearTime !== undefined) {
    const parsedWear = Number(wearTime)
    if (!Number.isFinite(parsedWear)) throw badRequest('Срок носки должен быть числом')
    patch.wear_time_override_months = parsedWear
  }

  if (
    (Object.prototype.hasOwnProperty.call(patch, 'item_type_id') ||
      Object.prototype.hasOwnProperty.call(patch, 'wear_time_override_months')) &&
    !Object.prototype.hasOwnProperty.call(patch, 'expiry_date')
  ) {
    const item = await pool.query('SELECT * FROM item_types WHERE id=$1', [itemTypeId])
    const effectiveWear = wearTime
      ? Number(wearTime)
      : item.rows[0]?.default_wear_time_months || null
    const issueDate = patch.issue_date ?? current.issue_date
    const { expiryDate, reorderDate: computedReorderDate } = await calculateExpiryAndReorder(
      issueDate,
      effectiveWear
    )
    patch.expiry_date = expiryDate
    patch.reorder_date = computedReorderDate
  }

  const columns = Object.keys(patch)
  if (columns.length === 0) return current

  const assignments = columns.map((c, i) => `${c}=$${i + 1}`)
  const values = columns.map((c) => patch[c])

  const result = await pool.query(
    `UPDATE issue_records SET ${assignments.join(', ')} WHERE id=$${values.length + 1} RETURNING *`,
    [...values, id]
  )
  return result.rows[0]
}

export async function updateExpiredIssueRecordsStatus() {
  const result = await pool.query(
    `UPDATE issue_records SET status='due_for_disposal' WHERE status='issued' AND expiry_date < NOW() RETURNING id`
  )
  return result.rows
}

export async function batchIssueRecordsForEmployee(employeeId, records, issueDate) {
  const result = await pool.query(
    `INSERT INTO issue_records (employee_id, item_type_id, quantity, issue_date, expiry_date, certificate_id, reorder_date, wear_time_override_months, notes, issue_method, write_off_act)
     SELECT $1, * FROM UNNEST($2::int[], $3::int[], $4::date[], $5::date[], $6::int[], $7::date[], $8::int[], $9::text[], $10::text[], $11::text[]) RETURNING *`,
    [
      employeeId,
      records.map((r) => r.item_type_id),
      records.map((r) => r.quantity),
      records.map(() => issueDate),
      records.map((r) => r.expiry_date),
      records.map((r) => r.certificate_id),
      records.map((r) => r.reorder_date),
      records.map((r) => r.wear_time_override),
      records.map((r) => r.notes || null),
      records.map((r) => r.issue_method || null),
      records.map((r) => r.write_off_act || null),
    ]
  )
  return result.rows
}
