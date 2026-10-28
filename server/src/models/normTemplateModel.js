import pool from './db.js'

const TEMPLATE_COLUMNS = [
  'name',
  'position',
  'site_id',
]

export async function getAllNormTemplates() {
  const result = await pool.query(`
    SELECT t.*, s.name as site_name,
           COUNT(ti.id)::int as item_count
    FROM norm_templates t
    LEFT JOIN sites s ON t.site_id = s.id
    LEFT JOIN norm_template_items ti ON ti.template_id = t.id
    GROUP BY t.id, s.name
    ORDER BY t.position, t.name
  `)
  return result.rows
}

export async function getNormTemplateById(id) {
  const parsedId = Number(id)
  if (!Number.isInteger(parsedId) || parsedId <= 0) return null
  const [template, items] = await Promise.all([
    pool.query(
      `
      SELECT t.*, s.name as site_name
      FROM norm_templates t
      LEFT JOIN sites s ON t.site_id = s.id
      WHERE t.id = $1
    `,
      [parsedId]
    ),
    pool.query(
      `
      SELECT ti.*, it.name as item_type_name, it.category, it.unit
      FROM norm_template_items ti
      JOIN item_types it ON ti.item_type_id = it.id
      WHERE ti.template_id = $1
      ORDER BY it.category, it.name
    `,
      [parsedId]
    ),
  ])
  if (!template.rows[0]) return null
  return { ...template.rows[0], items: items.rows }
}

export async function createNormTemplate(data) {
  const fields = []
  const values = []
  const placeholders = []
  let idx = 1

  for (const col of TEMPLATE_COLUMNS) {
    if (Object.prototype.hasOwnProperty.call(data, col) && data[col] !== undefined) {
      fields.push(`"${col}"`)
      placeholders.push(`$${idx++}`)
      values.push(data[col])
    }
  }

  const result = await pool.query(
    `INSERT INTO norm_templates (${fields.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`,
    values
  )
  return result.rows[0]
}

export async function updateNormTemplate(id, data) {
  const parsedId = Number(id)
  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    throw new Error('Некорректный ID шаблона')
  }

  const updateFields = []
  const updateValues = []
  let idx = 1

  for (const col of TEMPLATE_COLUMNS) {
    if (Object.prototype.hasOwnProperty.call(data, col) && data[col] !== undefined) {
      updateFields.push(`"${col}" = $${idx++}`)
      updateValues.push(data[col])
    }
  }

  if (updateFields.length === 0) return getNormTemplateById(parsedId)

  updateValues.push(parsedId)
  const result = await pool.query(
    `UPDATE norm_templates SET ${updateFields.join(', ')}, updated_at = NOW() WHERE id = $${updateValues.length} RETURNING *`,
    updateValues
  )
  return result.rows[0] || null
}

export async function deleteNormTemplate(id) {
  const parsedId = Number(id)
  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    throw new Error('Некорректный ID шаблона')
  }
  const result = await pool.query('DELETE FROM norm_templates WHERE id = $1 RETURNING *', [parsedId])
  return result.rows[0] || null
}

export async function createNormTemplateItem(templateId, data) {
  const parsedTemplateId = Number(templateId)
  if (!Number.isInteger(parsedTemplateId) || parsedTemplateId <= 0) {
    throw new Error('Некорректный ID шаблона')
  }

  const fields = ['template_id']
  const values = [parsedTemplateId]
  const placeholders = ['$1']
  let idx = 2

  const writable = ['item_type_id', 'period_months', 'quantity', 'etn_point', 'period_text', 'seasonality']
  for (const col of writable) {
    if (Object.prototype.hasOwnProperty.call(data, col) && data[col] !== undefined) {
      fields.push(`"${col}"`)
      placeholders.push(`$${idx++}`)
      values.push(data[col])
    }
  }

  const result = await pool.query(
    `INSERT INTO norm_template_items (${fields.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`,
    values
  )
  return result.rows[0]
}

export async function getNormTemplateItems(templateId) {
  const parsedId = Number(templateId)
  if (!Number.isInteger(parsedId) || parsedId <= 0) return []

  const result = await pool.query(
    `
    SELECT ti.*, it.name as item_type_name, it.category, it.unit
    FROM norm_template_items ti
    JOIN item_types it ON ti.item_type_id = it.id
    WHERE ti.template_id = $1
    ORDER BY it.category, it.name
  `,
    [parsedId]
  )
  return result.rows
}

export async function deleteNormTemplateItem(id) {
  const parsedId = Number(id)
  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    throw new Error('Некорректный ID элемента шаблона')
  }
  const result = await pool.query('DELETE FROM norm_template_items WHERE id = $1 RETURNING *', [parsedId])
  return result.rows[0] || null
}

export async function getNormTemplatesByPosition(position) {
  const result = await pool.query(
    `
    SELECT t.*, s.name as site_name
    FROM norm_templates t
    LEFT JOIN sites s ON t.site_id = s.id
    WHERE t.position = $1
    ORDER BY t.name
  `,
    [position]
  )
  return result.rows
}

export async function getTemplateNormsForEmployee(employee) {
  if (!employee.template_id) return null

  const result = await pool.query(
    `
    SELECT ti.*, it.name as item_type_name, it.category, it.etn_point as item_type_etn_point
    FROM norm_template_items ti
    JOIN item_types it ON ti.item_type_id = it.id
    WHERE ti.template_id = $1
    ORDER BY it.category, it.name
  `,
    [employee.template_id]
  )
  return result.rows
}
