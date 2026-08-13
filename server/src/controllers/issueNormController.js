import {
  createIssueNorm,
  getAllIssueNorms,
  getNormsForEmployee
} from '../models/issueNormModel.js';

export async function addNorm(req, res) {
  try {
    const { item_type_id, period_months, quantity, gender, position, site_id, seasonality, etn_point, period_text } = req.body;
    if (!item_type_id || !period_months) {
      return res.status(400).json({ error: 'item_type_id and period_months are required' });
    }
    const norm = await createIssueNorm(item_type_id, period_months, quantity, gender, position, site_id, seasonality, etn_point, period_text);
    res.status(201).json(norm);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function listNorms(req, res) {
  try {
    const norms = await getAllIssueNorms();
    res.json(norms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function getEmployeeNorms(req, res) {
  try {
    const pool = (await import('../models/db.js')).default;
    const employee = await pool.query('SELECT * FROM employees WHERE id = $1', [req.params.employeeId]);
    if (!employee.rows[0]) return res.status(404).json({ error: 'Employee not found' });
    const norms = await getNormsForEmployee(employee.rows[0]);
    res.json(norms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}