import {
  createIssueRecord,
  getAllIssueRecords,
  getIssueRecordsByEmployee,
  getIssueRecordsBySite,
  disposeIssueRecord,
  returnIssueRecord,
  batchIssueRecords,
  getExpiringItems,
  getIssueRecordById,
  updateIssueRecord,
  deleteIssueRecord
} from '../models/issueRecordModel.js';
import pool from '../models/db.js';

export async function issueItem(req, res, next) {
  try {
    const { employee_id, item_type_id, quantity, issue_date, certificate_id, wear_time_override, signature_path, signature_date, notes } = req.body;
    if (!employee_id || !item_type_id) {
      return res.status(400).json({ error: 'employee_id and item_type_id are required' });
    }
    const item = await pool.query('SELECT * FROM item_types WHERE id = $1', [item_type_id]);
    if (!item.rows[0]) return res.status(404).json({ error: 'Item type not found' });

    const wearTime = wear_time_override ? Number(wear_time_override) : (item.rows[0].default_wear_time_months || null);
    let expiryDate = null;
    if (wearTime) {
      const issueDate = issue_date ? new Date(issue_date) : new Date();
      expiryDate = new Date(issueDate);
      expiryDate.setMonth(expiryDate.getMonth() + wearTime);
    }

    const reorderDate = expiryDate ? new Date(expiryDate) : null;
    if (reorderDate) {
      reorderDate.setMonth(reorderDate.getMonth() - 2);
    }

    const record = await createIssueRecord(
      employee_id, item_type_id, quantity || 1, issue_date || new Date().toISOString().split('T')[0],
      expiryDate ? expiryDate.toISOString().split('T')[0] : null,
      certificate_id || null,
      reorderDate ? reorderDate.toISOString().split('T')[0] : null,
      wear_time_override || null
    );
    if (signature_path || signature_date) {
      await pool.query('UPDATE issue_records SET signature_path=$1, signature_date=$2 WHERE id=$3', [signature_path || null, signature_date || null, record.id]);
    }
    res.status(201).json(record);
  } catch (error) {
    next(error);
  }
}

export async function batchIssue(req, res, next) {
  try {
    const { site_id, item_type_id, quantity, issue_date, certificate_id, wear_time_override, notes } = req.body;
    if (!site_id || !item_type_id) {
      return res.status(400).json({ error: 'site_id and item_type_id are required' });
    }
    const employees = await pool.query('SELECT id FROM employees WHERE site_id=$1 AND status=$2', [site_id, 'active']);
    if (employees.rows.length === 0) {
      return res.status(404).json({ error: 'No active employees at this site' });
    }

    const item = await pool.query('SELECT * FROM item_types WHERE id = $1', [item_type_id]);
    if (!item.rows[0]) return res.status(404).json({ error: 'Item type not found' });

    const wearTime = wear_time_override ? Number(wear_time_override) : (item.rows[0].default_wear_time_months || null);
    const issueDate = issue_date || new Date().toISOString().split('T')[0];
    let expiryDate = null;
    if (wearTime) {
      expiryDate = new Date(issueDate);
      expiryDate.setMonth(expiryDate.getMonth() + wearTime);
    }
    const reorderDate = expiryDate ? new Date(expiryDate) : null;
    if (reorderDate) {
      reorderDate.setMonth(reorderDate.getMonth() - 2);
    }

    const records = employees.rows.map(emp => ({
      employee_id: emp.id,
      item_type_id,
      quantity: quantity || 1,
      issue_date: issueDate,
      expiry_date: expiryDate ? expiryDate.toISOString().split('T')[0] : null,
      certificate_id: certificate_id || null,
      reorder_date: reorderDate ? reorderDate.toISOString().split('T')[0] : null,
      wear_time_override: wear_time_override ? Number(wear_time_override) : null,
      notes: notes || null
    }));

    const created = await batchIssueRecords(records);
    res.status(201).json({ count: created.length, records: created });
  } catch (error) {
    next(error);
  }
}

export async function listIssues(req, res, next) {
  try {
    const { employee_id, site_id, item_type_id, status, date_from, date_to } = req.query;
    let query = `
      SELECT r.*, e.full_name, e.position, e.site_id, it.name as item_type_name, it.category, c.certificate_number
      FROM issue_records r
      JOIN employees e ON r.employee_id = e.id
      JOIN item_types it ON r.item_type_id = it.id
      LEFT JOIN certificates c ON r.certificate_id = c.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (employee_id) {
      query += ` AND r.employee_id = $${paramIndex++}`;
      params.push(employee_id);
    }
    if (site_id) {
      query += ` AND e.site_id = $${paramIndex++}`;
      params.push(site_id);
    }
    if (item_type_id) {
      query += ` AND r.item_type_id = $${paramIndex++}`;
      params.push(item_type_id);
    }
    if (status) {
      query += ` AND r.status = $${paramIndex++}`;
      params.push(status);
    }
    if (date_from) {
      query += ` AND r.issue_date >= $${paramIndex++}`;
      params.push(date_from);
    }
    if (date_to) {
      query += ` AND r.issue_date <= $${paramIndex++}`;
      params.push(date_to);
    }

    query += ' ORDER BY r.issue_date DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
}

export async function dispose(req, res, next) {
  try {
    const current = await getIssueRecordById(req.params.id);
    if (!current) return res.status(404).json({ error: 'Record not found' });
    if (current.status !== 'issued') {
      return res.status(409).json({ error: `Cannot dispose a record with status '${current.status}'` });
    }
    const record = await disposeIssueRecord(req.params.id);
    if (!record) return res.status(404).json({ error: 'Record not found' });
    res.json(record);
  } catch (error) {
    next(error);
  }
}

export async function returnItem(req, res, next) {
  try {
    const { return_date, return_quantity } = req.body;
    const current = await getIssueRecordById(req.params.id);
    if (!current) return res.status(404).json({ error: 'Record not found' });
    if (current.status !== 'issued') {
      return res.status(409).json({ error: `Cannot return a record with status '${current.status}'` });
    }
    const qty = Number(return_quantity) || 0;
    if (qty > Number(current.quantity)) {
      return res.status(400).json({ error: 'return_quantity exceeds issued quantity' });
    }
    const record = await returnIssueRecord(req.params.id, return_date || new Date().toISOString().split('T')[0], qty);
    if (!record) return res.status(404).json({ error: 'Record not found' });
    res.json(record);
  } catch (error) {
    next(error);
  }
}

export async function getExpiring(req, res, next) {
  try {
    const months = parseInt(req.query.months) || 2;
    const items = await getExpiringItems(months);
    res.json(items);
  } catch (error) {
    next(error);
  }
}

export async function getIssue(req, res, next) {
  try {
    const record = await getIssueRecordById(req.params.id);
    if (!record) return res.status(404).json({ error: 'Issue record not found' });
    res.json(record);
  } catch (error) {
    next(error);
  }
}

export async function updateIssue(req, res, next) {
  try {
    const record = await updateIssueRecord(req.params.id, req.body);
    if (!record) return res.status(404).json({ error: 'Issue record not found' });
    res.json(record);
  } catch (error) {
    next(error);
  }
}

export async function deleteIssue(req, res, next) {
  try {
    const record = await deleteIssueRecord(req.params.id);
    if (!record) return res.status(404).json({ error: 'Issue record not found' });
    res.json({ message: 'Issue record deleted' });
  } catch (error) {
    next(error);
  }
}