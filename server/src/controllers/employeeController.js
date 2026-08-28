import { childLogger } from '../utils/logger.js';
const log = childLogger('employee');

import { createEmployee, getAllEmployees, getEmployeeById, updateEmployee, terminateEmployee, deleteEmployee as deleteEmployeeModel } from '../models/employeeModel.js';
import { getNormsForEmployee } from '../models/issueNormModel.js';
import { getIssueRecordsByEmployee } from '../models/issueRecordModel.js';
import pool from '../models/db.js';
import { EmployeeSchema } from '../validation/index.js';
import { validate } from '../middleware/validate.js';

export async function registerEmployee(req, res, next) {
  try {
    const data = EmployeeSchema.parse(req.body);
    const employee = await createEmployee(
      data.full_name,
      data.position,
      data.site_id === '' || data.site_id === null ? null : Number(data.site_id),
      data.gender || null,
      data.hire_date || null,
      data.clothing_size || null,
      data.shoe_size || null,
      data.height ? Number(data.height) : null,
      data.personnel_number || null,
      data.hat_size || null,
      data.respirator_size || null,
      data.gloves_size || null,
      data.position_change_date || null
    );
    res.status(201).json(employee);
  } catch (error) {
    log.error(error);
    next(error);
  }
}

export async function listEmployees(req, res, next) {
  try {
    const { search, status, site_id } = req.query;
    let query = 'SELECT e.*, s.name as site_name FROM employees e LEFT JOIN sites s ON e.site_id = s.id WHERE 1=1';
    const params = [];
    let paramIndex = 1;
    
    if (search) {
      query += ` AND e.full_name ILIKE $${paramIndex++}`;
      params.push(`%${search}%`);
    }
    if (status) {
      query += ` AND e.status = $${paramIndex++}`;
      params.push(status);
    }
    if (site_id) {
      query += ` AND e.site_id = $${paramIndex++}`;
      params.push(site_id);
    }
    query += ' ORDER BY e.created_at DESC';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    log.error(error);
    next(error);
  }
}

export async function getEmployee(req, res, next) {
  try {
    const employee = await getEmployeeById(req.params.id);
    if (!employee) return res.status(404).json({ error: 'Employee not found' });
    
    const norms = await getNormsForEmployee(employee);
    const history = await getIssueRecordsByEmployee(req.params.id);
    
    res.json({ ...employee, norms, history });
  } catch (error) {
    log.error(error);
    next(error);
  }
}

export async function editEmployee(req, res, next) {
  try {
    const data = { ...req.body };
    if (data.site_id === '' || data.site_id === null || data.site_id === undefined) data.site_id = null;
    else data.site_id = Number(data.site_id);
    if (data.height === '' || data.height === null || data.height === undefined) data.height = null;
    else data.height = Number(data.height);
    ['hire_date', 'position_change_date'].forEach(f => {
      if (data[f] === '' || data[f] === null || data[f] === undefined) data[f] = null;
    });
    const employee = await updateEmployee(req.params.id, data);
    if (!employee) return res.status(404).json({ error: 'Employee not found' });
    res.json(employee);
  } catch (error) {
    log.error(error);
    next(error);
  }
}

export async function fireEmployee(req, res, next) {
  try {
    const employee = await terminateEmployee(req.params.id);
    if (!employee) return res.status(404).json({ error: 'Employee not found' });
    res.json(employee);
  } catch (error) {
    log.error(error);
    next(error);
  }
}

export async function deleteEmployee(req, res, next) {
  try {
    const employee = await deleteEmployeeModel(req.params.id);
    if (!employee) return res.status(404).json({ error: 'Employee not found' });
    res.json({ message: 'Employee deleted' });
  } catch (error) {
    log.error(error);
    next(error);
  }
}
