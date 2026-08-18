import {
  createForm,
  getAllForms,
  recordFormTaken,
  getFormTakenRecords,
  getFormTakenByEmployee
} from '../models/formModel.js';

export async function addForm(req, res, next) {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }
    const form = await createForm(name, description);
    res.status(201).json(form);
  } catch (error) {
    next(error);
  }
}

export async function listForms(req, res, next) {
  try {
    const forms = await getAllForms();
    res.json(forms);
  } catch (error) {
    next(error);
  }
}

export async function takeForm(req, res, next) {
  try {
    const { employee_id, form_id } = req.body;
    if (!employee_id || !form_id) {
      return res.status(400).json({ error: 'employee_id and form_id are required' });
    }
    const record = await recordFormTaken(employee_id, form_id);
    res.status(201).json(record);
  } catch (error) {
    next(error);
  }
}

export async function listFormTaken(req, res, next) {
  try {
    const records = await getFormTakenRecords();
    res.json(records);
  } catch (error) {
    next(error);
  }
}

export async function listFormTakenByEmployee(req, res, next) {
  try {
    const records = await getFormTakenByEmployee(req.params.employeeId);
    res.json(records);
  } catch (error) {
    next(error);
  }
}