import { childLogger } from '../utils/logger.js';
const log = childLogger('form');

import {
  createForm,
  getFormById,
  updateForm,
  deleteForm,
  getAllForms,
  recordFormTaken,
  getFormTakenRecords,
  getFormTakenByEmployee
} from '../models/formModel.js';
import pool from '../models/db.js';

export async function addForm(req, res, next) {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Введите название формы' });
    }
    const form = await createForm(name, description);
    res.status(201).json(form);
  } catch (error) {
    log.error(error);
    next(error);
  }
}

export async function getForm(req, res, next) {
  try {
    const form = await getFormById(req.params.id);
    if (!form) return res.status(404).json({ error: 'Форма не найдена' });
    res.json(form);
  } catch (error) {
    log.error(error);
    next(error);
  }
}

export async function updateFormController(req, res, next) {
  try {
    const { name, description } = req.body;
    const form = await updateForm(req.params.id, name, description);
    if (!form) return res.status(404).json({ error: 'Форма не найдена' });
    res.json(form);
  } catch (error) {
    log.error(error);
    next(error);
  }
}

export async function deleteFormController(req, res, next) {
  try {
    const form = await deleteForm(req.params.id);
    if (!form) return res.status(404).json({ error: 'Форма не найдена' });
    res.json({ message: 'Форма удалена' });
  } catch (error) {
    log.error(error);
    next(error);
  }
}

export async function listForms(req, res, next) {
  try {
    const forms = await getAllForms();
    res.json(forms);
  } catch (error) {
    log.error(error);
    next(error);
  }
}

export async function takeForm(req, res, next) {
  try {
    const { employee_id, form_id } = req.body;
    if (!employee_id || !form_id) {
      return res.status(400).json({ error: 'Укажите сотрудника и форму' });
    }
    const emp = await pool.query('SELECT id FROM employees WHERE id=$1', [employee_id]);
    if (!emp.rows[0]) return res.status(404).json({ error: 'Сотрудник не найден' });
    const form = await pool.query('SELECT id FROM forms WHERE id=$1', [form_id]);
    if (!form.rows[0]) return res.status(404).json({ error: 'Форма не найдена' });
    const record = await recordFormTaken(employee_id, form_id);
    res.status(201).json(record);
  } catch (error) {
    log.error(error);
    next(error);
  }
}

export async function listFormTaken(req, res, next) {
  try {
    const records = await getFormTakenRecords();
    res.json(records);
  } catch (error) {
    log.error(error);
    next(error);
  }
}

export async function listFormTakenByEmployee(req, res, next) {
  try {
    const records = await getFormTakenByEmployee(req.params.employeeId);
    res.json(records);
  } catch (error) {
    log.error(error);
    next(error);
  }
}