import { createEmployee, getAllEmployees, getEmployeeById, updateEmployee, terminateEmployee } from '../models/employeeModel.js';
import { getNormsForEmployee } from '../models/issueNormModel.js';
import { getIssueRecordsByEmployee } from '../models/issueRecordModel.js';
import pool from '../models/db.js';

export async function registerEmployee(req, res) {
  try {
    const { full_name, position, site_id, gender, hire_date, clothing_size, shoe_size, height, personnel_number, hat_size, respirator_size, gloves_size, position_change_date } = req.body;
    if (!full_name || !position) {
      return res.status(400).json({ error: 'full_name and position are required' });
    }
    const employee = await createEmployee(
      full_name,
      position,
      site_id === '' ? null : Number(site_id),
      gender || null,
      hire_date || null,
      clothing_size || null,
      shoe_size || null,
      height ? Number(height) : null,
      personnel_number || null,
      hat_size || null,
      respirator_size || null,
      gloves_size || null,
      position_change_date || null
    );
    res.status(201).json(employee);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function listEmployees(req, res) {
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
    res.status(500).json({ error: error.message });
  }
}

export async function getEmployee(req, res) {
  try {
    const employee = await getEmployeeById(req.params.id);
    if (!employee) return res.status(404).json({ error: 'Employee not found' });
    
    const norms = await getNormsForEmployee(employee);
    const history = await getIssueRecordsByEmployee(req.params.id);
    
    res.json({ ...employee, norms, history });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function editEmployee(req, res) {
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
    res.status(500).json({ error: error.message });
  }
}

export async function fireEmployee(req, res) {
  try {
    const employee = await terminateEmployee(req.params.id);
    if (!employee) return res.status(404).json({ error: 'Employee not found' });
    res.json(employee);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}