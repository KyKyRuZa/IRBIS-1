import { childLogger } from '../utils/logger.js'
const log = childLogger('employee')

import {
  createEmployee,
  getEmployeeById,
  updateEmployee,
  terminateEmployee,
  deleteEmployee as deleteEmployeeModel,
  getEmployeesWithSizesBySite,
} from '../models/employeeModel.js'
import { getNormsForEmployee } from '../models/issueNormModel.js'
import { getNormTemplatesByPosition } from '../models/normTemplateModel.js'
import { getIssueRecordsByEmployee } from '../models/issueRecordModel.js'
import pool from '../models/db.js'
import { EmployeeSchema } from '../validation/index.js'

export async function registerEmployee(req, res, next) {
  try {
    const data = EmployeeSchema.parse(req.body)
    const employee = await createEmployee(
      data.full_name,
      data.position,
      data.site_id === '' || data.site_id === null || data.site_id === undefined ? null : Number(data.site_id),
      data.gender || null,
      data.hire_date || null,
      data.clothing_size || null,
      data.shoe_size || null,
      data.height ? Number(data.height) : null,
      data.personnel_number || null,
      data.hat_size || null,
      data.respirator_size || null,
      data.gloves_size || null,
      data.position_change_date || null,
      data.template_id || null
    )
    res.status(201).json(employee)
  } catch (error) {
    log.error(error)
    next(error)
  }
}

export async function listEmployees(req, res, next) {
  try {
    const { search, status, site_id, page, limit: limitQuery } = req.query
    const pageNum = Math.max(1, parseInt(page) || 1)
    const limitNum = Math.min(200, Math.max(1, parseInt(limitQuery) || 50))
    const offset = (pageNum - 1) * limitNum

    let whereClause = ''
    const params = []
    let paramIndex = 1

    if (search) {
      whereClause += ` AND e.full_name ILIKE $${paramIndex++}`
      params.push(`%${search}%`)
    }
    if (status) {
      whereClause += ` AND e.status = $${paramIndex++}`
      params.push(status)
    }
    if (site_id) {
      whereClause += ` AND e.site_id = $${paramIndex++}`
      params.push(site_id)
    }

    const [result, countResult] = await Promise.all([
      pool.query(
        `SELECT e.*, s.name as site_name FROM employees e LEFT JOIN sites s ON e.site_id = s.id WHERE 1=1 ${whereClause}
         ORDER BY e.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
        [...params, limitNum, offset]
      ),
      pool.query(`SELECT COUNT(*) FROM employees e WHERE 1=1 ${whereClause}`, params),
    ])

    const total = Number(countResult.rows[0].count)
    res.set('X-Pagination', JSON.stringify({ page: pageNum, limit: limitNum, total }))
    res.json({ data: result.rows, pagination: { page: pageNum, limit: limitNum, total } })
  } catch (error) {
    log.error(error)
    next(error)
  }
}

export async function getEmployee(req, res, next) {
  try {
    if (req.user?.role !== 'admin' && req.employeeId && req.employeeId !== Number(req.params.id)) {
      return res.status(403).json({ error: 'Доступ запрещён: можно просматривать только свои записи о сотрудниках' })
    }
    const employee = await getEmployeeById(req.params.id)
    if (!employee) return res.status(404).json({ error: 'Сотрудник не найден' })

    const [norms, history, templates] = await Promise.all([
      getNormsForEmployee(employee),
      getIssueRecordsByEmployee(req.params.id),
      getNormTemplatesByPosition(employee.position, employee.gender),
    ])

    res.json({ ...employee, norms, history, templates })
  } catch (error) {
    log.error(error)
    next(error)
  }
}

export async function editEmployee(req, res, next) {
  try {
    const data = { ...req.body }
    // Only normalize fields that are actually present in the request body.
    // undefined means "not changed" (keep existing value), not "set to NULL".
    if (Object.prototype.hasOwnProperty.call(data, 'site_id')) {
      if (data.site_id !== '' && data.site_id !== null && data.site_id !== undefined) {
        const parsedSite = Number(data.site_id)
        data.site_id = Number.isFinite(parsedSite) ? parsedSite : null
      } else {
        data.site_id = data.site_id === undefined ? undefined : null
      }
    }
    if (Object.prototype.hasOwnProperty.call(data, 'height')) {
      if (data.height === '' || data.height === null || data.height === undefined) {
        data.height = null
      } else {
        const parsedHeight = Number(data.height)
        data.height = Number.isFinite(parsedHeight) ? parsedHeight : null
      }
    }
    if (Object.prototype.hasOwnProperty.call(data, 'hire_date')) {
      if (data.hire_date === '' || data.hire_date === null || data.hire_date === undefined) {
        data.hire_date = null
      }
    }
    if (Object.prototype.hasOwnProperty.call(data, 'position_change_date')) {
      if (data.position_change_date === '' || data.position_change_date === null || data.position_change_date === undefined) {
        data.position_change_date = null
      }
    }
    const employee = await updateEmployee(req.params.id, data)
    if (!employee) return res.status(404).json({ error: 'Сотрудник не найден' })
    res.json(employee)
  } catch (error) {
    log.error(error)
    next(error)
  }
}

export async function fireEmployee(req, res, next) {
  try {
    const employee = await terminateEmployee(req.params.id)
    if (!employee) return res.status(404).json({ error: 'Сотрудник не найден' })
    res.json(employee)
  } catch (error) {
    log.error(error)
    next(error)
  }
}

export async function deleteEmployee(req, res, next) {
  try {
    const employee = await deleteEmployeeModel(req.params.id)
    if (!employee) return res.status(404).json({ error: 'Сотрудник не найден' })
    res.json({ message: 'Сотрудник удалён' })
  } catch (error) {
    log.error(error)
    next(error)
  }
}

export async function getEmployeesSizesBySite(req, res, next) {
  try {
    const rows = await getEmployeesWithSizesBySite(req.params.siteId)
    res.json(rows)
  } catch (error) {
    log.error(error)
    next(error)
  }
}
