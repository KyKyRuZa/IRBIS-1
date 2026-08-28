import { childLogger } from '../utils/logger.js';
const log = childLogger('issueNorm');

import {
  createIssueNorm,
  getAllIssueNorms,
  getNormsForEmployee,
  getNormById,
  updateIssueNorm,
  deleteIssueNorm
} from '../models/issueNormModel.js';

export async function addNorm(req, res, next) {
  try {
    const { item_type_id, period_months } = req.body ?? {};
    if (!item_type_id || !period_months) {
      return res.status(400).json({ error: 'item_type_id and period_months are required' });
    }
    const norm = await createIssueNorm(req.body);
    res.status(201).json(norm);
  } catch (error) {
    log.error(error);
    next(error);
  }
}

export async function listNorms(req, res, next) {
  try {
    const norms = await getAllIssueNorms();
    res.json(norms);
  } catch (error) {
    log.error(error);
    next(error);
  }
}

export async function getNorm(req, res, next) {
  try {
    const norm = await getNormById(req.params.id);
    if (!norm) return res.status(404).json({ error: 'Norm not found' });
    res.json(norm);
  } catch (error) {
    log.error(error);
    next(error);
  }
}

export async function updateNorm(req, res, next) {
  try {
    const norm = await updateIssueNorm(req.params.id, req.body);
    if (!norm) return res.status(404).json({ error: 'Norm not found' });
    res.json(norm);
  } catch (error) {
    log.error(error);
    next(error);
  }
}

export async function deleteNorm(req, res, next) {
  try {
    const norm = await deleteIssueNorm(req.params.id);
    if (!norm) return res.status(404).json({ error: 'Norm not found' });
    res.json({ message: 'Norm deleted' });
  } catch (error) {
    log.error(error);
    next(error);
  }
}

export async function getEmployeeNorms(req, res, next) {
  try {
    const pool = (await import('../models/db.js')).default;
    const employee = await pool.query('SELECT * FROM employees WHERE id = $1', [req.params.employeeId]);
    if (!employee.rows[0]) return res.status(404).json({ error: 'Employee not found' });
    const norms = await getNormsForEmployee(employee.rows[0]);
    res.json(norms);
  } catch (error) {
    log.error(error);
    next(error);
  }
}