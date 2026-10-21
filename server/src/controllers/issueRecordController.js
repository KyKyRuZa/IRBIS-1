import { childLogger } from '../utils/logger.js'
const log = childLogger('issueRecord')

import {
  createIssueRecord,
  disposeIssueRecord,
  returnIssueRecordAtomic,
  batchIssueRecords,
  batchIssueRecordsForEmployee,
  getExpiringItems,
  getIssueRecordById,
  updateIssueRecord,
  deleteIssueRecord,
  SHEET_NUMBER_SELECT,
} from '../models/issueRecordModel.js'
import pool from '../models/db.js'

function localDate(date) {
  const d = date ? new Date(date) : new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export async function issueItem(req, res, next) {
  try {
    const {
      employee_id,
      item_type_id,
      quantity,
      issue_date,
      certificate_id,
      wear_time_override,
      notes,
      issue_method,
      write_off_act,
    } = req.body
    if (!employee_id || !item_type_id) {
      return res.status(400).json({ error: 'employee_id and item_type_id are required' })
    }

    const [emp, item] = await Promise.all([
      pool.query('SELECT id FROM employees WHERE id=$1', [employee_id]),
      pool.query('SELECT * FROM item_types WHERE id = $1', [item_type_id]),
    ])
    if (!emp.rows[0]) return res.status(404).json({ error: 'Employee not found' })
    if (!item.rows[0]) return res.status(404).json({ error: 'Item type not found' })
    if (item.rows[0].requires_certificate && !certificate_id) {
      return res.status(400).json({ error: 'certificate_id is required for this item type' })
    }

    const wearTime = wear_time_override
      ? Number(wear_time_override)
      : item.rows[0].default_wear_time_months || null
    let expiryDate = null
    if (wearTime) {
      const issueDate = issue_date ? new Date(issue_date) : new Date()
      expiryDate = new Date(issueDate)
      expiryDate.setMonth(expiryDate.getMonth() + wearTime)
    }

    const reorderDate = expiryDate ? new Date(expiryDate) : null
    if (reorderDate) {
      reorderDate.setMonth(reorderDate.getMonth() - 2)
    }

    const record = await createIssueRecord(
      employee_id,
      item_type_id,
      quantity || 1,
      issue_date || localDate(),
      expiryDate ? expiryDate.toISOString().split('T')[0] : null,
      certificate_id || null,
      reorderDate ? reorderDate.toISOString().split('T')[0] : null,
      wear_time_override || null,
      notes || null,
      issue_method || null,
      null,
      null,
      write_off_act || null
    )
    res.status(201).json(record)
  } catch (error) {
    log.error(error)
    next(error)
  }
}

export async function batchIssue(req, res, next) {
  try {
    const {
      site_id,
      item_type_id,
      quantity,
      issue_date,
      certificate_id,
      wear_time_override,
      notes,
      issue_method,
      position,
    } = req.body
    if (!site_id || !item_type_id) {
      return res.status(400).json({ error: 'site_id and item_type_id are required' })
    }
    // Необязательный фильтр по должности: выдать можно всем сотрудникам
    // объекта или только одной должности (например, всем операторам).
    const [employees, item] = await Promise.all([
      pool.query(
        'SELECT id FROM employees WHERE site_id=$1 AND status=$2 AND ($3::text IS NULL OR position=$3)',
        [site_id, 'active', position?.trim() || null]
      ),
      pool.query('SELECT * FROM item_types WHERE id = $1', [item_type_id]),
    ])
    if (employees.rows.length === 0) {
      return res.status(404).json({
        error: position?.trim()
          ? 'No active employees with this position at this site'
          : 'No active employees at this site',
      })
    }

    if (!item.rows[0]) return res.status(404).json({ error: 'Item type not found' })
    if (item.rows[0].requires_certificate && !certificate_id) {
      return res.status(400).json({ error: 'certificate_id is required for this item type' })
    }

    const wearTime = wear_time_override
      ? Number(wear_time_override)
      : item.rows[0].default_wear_time_months || null
    const issueDate = issue_date || localDate()
    let expiryDate = null
    if (wearTime) {
      expiryDate = new Date(issueDate)
      expiryDate.setMonth(expiryDate.getMonth() + wearTime)
    }
    const reorderDate = expiryDate ? new Date(expiryDate) : null
    if (reorderDate) {
      reorderDate.setMonth(reorderDate.getMonth() - 2)
    }

    const records = employees.rows.map((emp) => ({
      employee_id: emp.id,
      item_type_id,
      quantity: quantity || 1,
      issue_date: issueDate,
      expiry_date: expiryDate ? expiryDate.toISOString().split('T')[0] : null,
      certificate_id: certificate_id || null,
      reorder_date: reorderDate ? reorderDate.toISOString().split('T')[0] : null,
      wear_time_override: wear_time_override ? Number(wear_time_override) : null,
      notes: notes || null,
      issue_method: issue_method || null,
    }))

    const created = await batchIssueRecords(records)
    res.status(201).json({ count: created.length, records: created })
  } catch (error) {
    log.error(error)
    next(error)
  }
}

export async function batchIssueSingle(req, res, next) {
  try {
    const { employee_id, issue_date, items } = req.body
    if (!employee_id || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'employee_id and items array are required' })
    }
    const issueDate = issue_date || localDate()
    const itemTypeIds = items.map((i) => Number(i.item_type_id)).filter(Boolean)
    if (itemTypeIds.length !== items.filter((i) => i.item_type_id).length) {
      return res.status(400).json({ error: 'All items must have item_type_id' })
    }
    const [emp, itemsRes] = await Promise.all([
      pool.query('SELECT id FROM employees WHERE id=$1', [employee_id]),
      pool.query('SELECT * FROM item_types WHERE id = ANY($1::int[])', [itemTypeIds]),
    ])
    if (!emp.rows[0]) return res.status(404).json({ error: 'Employee not found' })
    const itemMap = new Map(itemsRes.rows.map((i) => [i.id, i]))

    const enriched = []
    for (const entry of items) {
      const item = itemMap.get(Number(entry.item_type_id))
      if (!item) return res.status(404).json({ error: `Item type ${entry.item_type_id} not found` })
      if (item.requires_certificate && !entry.certificate_id) {
        return res
          .status(400)
          .json({ error: `certificate_id is required for item type ${entry.item_type_id}` })
      }

      const wearTime = entry.wear_time_override
        ? Number(entry.wear_time_override)
        : item.default_wear_time_months || null
      let expiryDate = null
      if (wearTime) {
        expiryDate = new Date(issueDate)
        expiryDate.setMonth(expiryDate.getMonth() + wearTime)
      }
      const reorderDate = expiryDate ? new Date(expiryDate) : null
      if (reorderDate) reorderDate.setMonth(reorderDate.getMonth() - 2)

      enriched.push({
        item_type_id: entry.item_type_id,
        quantity: entry.quantity || 1,
        expiry_date: expiryDate ? expiryDate.toISOString().split('T')[0] : null,
        certificate_id: entry.certificate_id || null,
        reorder_date: reorderDate ? reorderDate.toISOString().split('T')[0] : null,
        wear_time_override: entry.wear_time_override ? Number(entry.wear_time_override) : null,
        notes: entry.notes || null,
        issue_method: entry.issue_method || null,
      })
    }

    if (enriched.length === 0) {
      return res.status(400).json({ error: 'No valid items to issue' })
    }

    const created = await batchIssueRecordsForEmployee(employee_id, enriched, issueDate)
    res.status(201).json({ count: created.length, records: created })
  } catch (error) {
    log.error(error)
    next(error)
  }
}

export async function listIssues(req, res, next) {
  try {
    const {
      employee_id,
      site_id,
      item_type_id,
      status,
      date_from,
      date_to,
      issue_method,
      page,
      limit: limitQuery,
    } = req.query
    const pageNum = Math.max(1, parseInt(page) || 1)
    const limitNum = Math.min(200, Math.max(1, parseInt(limitQuery) || 50))
    const offset = (pageNum - 1) * limitNum

    let whereClause = ''
    const params = []
    let paramIndex = 1

    if (employee_id) {
      whereClause += ` AND r.employee_id = $${paramIndex++}`
      params.push(employee_id)
    }
    if (site_id) {
      whereClause += ` AND e.site_id = $${paramIndex++}`
      params.push(site_id)
    }
    if (item_type_id) {
      whereClause += ` AND r.item_type_id = $${paramIndex++}`
      params.push(item_type_id)
    }
    if (status) {
      whereClause += ` AND r.status = $${paramIndex++}`
      params.push(status.toLowerCase())
    }
    if (date_from) {
      whereClause += ` AND r.issue_date >= $${paramIndex++}`
      params.push(date_from)
    }
    if (date_to) {
      whereClause += ` AND r.issue_date <= $${paramIndex++}`
      params.push(date_to)
    }
    if (issue_method) {
      whereClause += ` AND r.issue_method = $${paramIndex++}`
      params.push(issue_method.toLowerCase())
    }

    const [result, countResult] = await Promise.all([
      pool.query(
        `
        SELECT r.*, e.full_name, e.position, e.site_id, it.name as item_type_name, it.category, c.certificate_number,
          ${SHEET_NUMBER_SELECT}
        FROM issue_records r
        JOIN employees e ON r.employee_id = e.id
        JOIN item_types it ON r.item_type_id = it.id
        LEFT JOIN certificates c ON r.certificate_id = c.id
        WHERE 1=1 ${whereClause}
        ORDER BY r.issue_date DESC, r.id DESC
        LIMIT $${paramIndex++} OFFSET $${paramIndex++}
      `,
        [...params, limitNum, offset]
      ),
      pool.query(
        `
        SELECT COUNT(*)
        FROM issue_records r
        JOIN employees e ON r.employee_id = e.id
        JOIN item_types it ON r.item_type_id = it.id
        WHERE 1=1 ${whereClause}
      `,
        params
      ),
    ])

    res.set(
      'X-Pagination',
      JSON.stringify({ page: pageNum, limit: limitNum, total: Number(countResult.rows[0].count) })
    )
    res.json({
      data: result.rows,
      pagination: { page: pageNum, limit: limitNum, total: Number(countResult.rows[0].count) },
    })
  } catch (error) {
    log.error(error)
    next(error)
  }
}

export async function dispose(req, res, next) {
  try {
    const current = await getIssueRecordById(req.params.id)
    if (!current) return res.status(404).json({ error: 'Record not found' })
    if (!['issued', 'due_for_disposal'].includes(current.status)) {
      return res
        .status(409)
        .json({ error: `Cannot dispose a record with status '${current.status}'` })
    }
    const record = await disposeIssueRecord(req.params.id)
    if (!record) return res.status(404).json({ error: 'Record not found' })
    res.json(record)
  } catch (error) {
    log.error(error)
    next(error)
  }
}

export async function returnItem(req, res, next) {
  try {
    const { return_date, return_quantity } = req.body
    const qty = Number(return_quantity) || 0
    if (qty <= 0) {
      return res.status(400).json({ error: 'return_quantity must be greater than 0' })
    }

    const record = await returnIssueRecordAtomic(req.params.id, return_date || localDate(), qty)
    if (!record) {
      const current = await getIssueRecordById(req.params.id)
      if (!current) return res.status(404).json({ error: 'Record not found' })
      if (!['issued', 'due_for_disposal'].includes(current.status)) {
        return res
          .status(409)
          .json({ error: `Cannot return a record with status '${current.status}'` })
      }
      const alreadyReturned = Number(current.return_quantity) || 0
      const remaining = Number(current.quantity) - alreadyReturned
      if (qty > remaining) {
        return res
          .status(400)
          .json({ error: `return_quantity exceeds remaining quantity (${remaining})` })
      }
      return res.status(409).json({ error: 'Record status changed, please retry' })
    }
    res.json(record)
  } catch (error) {
    log.error(error)
    next(error)
  }
}

export async function getExpiring(req, res, next) {
  try {
    const months = parseInt(req.query.months || req.query.days) || 2
    if (months < 0) {
      return res.status(400).json({ error: 'months/days must be a non-negative number' })
    }
    const items = await getExpiringItems(months)
    res.json(items)
  } catch (error) {
    log.error(error)
    next(error)
  }
}

export async function getIssue(req, res, next) {
  try {
    const record = await getIssueRecordById(req.params.id)
    if (!record) return res.status(404).json({ error: 'Issue record not found' })
    res.json(record)
  } catch (error) {
    log.error(error)
    next(error)
  }
}

export async function updateIssue(req, res, next) {
  try {
    const record = await updateIssueRecord(req.params.id, req.body)
    if (!record) return res.status(404).json({ error: 'Issue record not found' })
    res.json(record)
  } catch (error) {
    log.error(error)
    next(error)
  }
}

export async function deleteIssue(req, res, next) {
  try {
    const record = await deleteIssueRecord(req.params.id)
    if (!record) return res.status(404).json({ error: 'Issue record not found' })
    res.json({ message: 'Issue record deleted' })
  } catch (error) {
    log.error(error)
    next(error)
  }
}
