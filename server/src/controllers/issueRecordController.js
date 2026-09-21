import { childLogger } from '../utils/logger.js';
const log = childLogger('issueRecord');

import {
  createIssueRecord,
  getAllIssueRecords,
  getIssueRecordsByEmployee,
  getIssueRecordsBySite,
  disposeIssueRecord,
  returnIssueRecord,
  batchIssueRecords,
  batchIssueRecordsForEmployee,
  getExpiringItems,
  getIssueRecordById,
  updateIssueRecord,
  deleteIssueRecord
} from '../models/issueRecordModel.js';
import pool from '../models/db.js';

function localDate(date) {
  const d = date ? new Date(date) : new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function issueItem(req, res, next) {
  try {
    const { employee_id, item_type_id, quantity, issue_date, certificate_id, wear_time_override, signature_path, signature_date, notes, issue_method } = req.body;
    if (!employee_id || !item_type_id) {
      return res.status(400).json({ error: 'employee_id and item_type_id are required' });
    }
    const emp = await pool.query('SELECT id FROM employees WHERE id=$1', [employee_id]);
    if (!emp.rows[0]) return res.status(404).json({ error: 'Employee not found' });

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
      employee_id, item_type_id, quantity || 1, issue_date || localDate(),
      expiryDate ? expiryDate.toISOString().split('T')[0] : null,
      certificate_id || null,
      reorderDate ? reorderDate.toISOString().split('T')[0] : null,
      wear_time_override || null,
      notes || null,
      issue_method || null,
      signature_path || null,
      signature_date || null
    );
    res.status(201).json(record);
  } catch (error) {
    log.error(error);
    next(error);
  }
}

export async function batchIssue(req, res, next) {
  try {
    const { site_id, item_type_id, quantity, issue_date, certificate_id, wear_time_override, notes, issue_method } = req.body;
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
    const issueDate = issue_date || localDate();
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
      notes: notes || null,
      issue_method: issue_method || null
    }));

    const created = await batchIssueRecords(records);
    res.status(201).json({ count: created.length, records: created });
  } catch (error) {
    log.error(error);
    next(error);
  }
}

export async function batchIssueSingle(req, res, next) {
  try {
    const { employee_id, issue_date, items } = req.body;
    if (!employee_id || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'employee_id and items array are required' });
    }
    const emp = await pool.query('SELECT id FROM employees WHERE id=$1', [employee_id]);
    if (!emp.rows[0]) return res.status(404).json({ error: 'Employee not found' });

    const issueDate = issue_date || localDate();
    const enriched = [];
    for (const entry of items) {
      if (!entry.item_type_id) {
        return res.status(400).json({ error: 'All items must have item_type_id' });
      }
      const item = await pool.query('SELECT * FROM item_types WHERE id = $1', [entry.item_type_id]);
      if (!item.rows[0]) return res.status(404).json({ error: `Item type ${entry.item_type_id} not found` });

      const wearTime = entry.wear_time_override ? Number(entry.wear_time_override) : (item.rows[0].default_wear_time_months || null);
      let expiryDate = null;
      if (wearTime) {
        expiryDate = new Date(issueDate);
        expiryDate.setMonth(expiryDate.getMonth() + wearTime);
      }
      const reorderDate = expiryDate ? new Date(expiryDate) : null;
      if (reorderDate) reorderDate.setMonth(reorderDate.getMonth() - 2);

      enriched.push({
        item_type_id: entry.item_type_id,
        quantity: entry.quantity || 1,
        expiry_date: expiryDate ? expiryDate.toISOString().split('T')[0] : null,
        certificate_id: entry.certificate_id || null,
        reorder_date: reorderDate ? reorderDate.toISOString().split('T')[0] : null,
        wear_time_override: entry.wear_time_override ? Number(entry.wear_time_override) : null,
        notes: entry.notes || null,
        issue_method: entry.issue_method || null,
      });
    }

    if (enriched.length === 0) {
      return res.status(400).json({ error: 'No valid items to issue' });
    }

    const created = await batchIssueRecordsForEmployee(employee_id, enriched, issueDate);
    res.status(201).json({ count: created.length, records: created });
  } catch (error) {
    log.error(error);
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
      params.push(status.toLowerCase());
    }
    if (date_from) {
      query += ` AND r.issue_date >= $${paramIndex++}`;
      params.push(date_from);
    }
    if (date_to) {
      query += ` AND r.issue_date <= $${paramIndex++}`;
      params.push(date_to);
    }

    query += ' ORDER BY r.issue_date DESC, r.id DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    log.error(error);
    next(error);
  }
}

export async function dispose(req, res, next) {
  try {
    const current = await getIssueRecordById(req.params.id);
    if (!current) return res.status(404).json({ error: 'Record not found' });
    if (!['issued', 'due_for_disposal'].includes(current.status)) {
      return res.status(409).json({ error: `Cannot dispose a record with status '${current.status}'` });
    }
    const record = await disposeIssueRecord(req.params.id);
    if (!record) return res.status(404).json({ error: 'Record not found' });
    res.json(record);
  } catch (error) {
    log.error(error);
    next(error);
  }
}

export async function returnItem(req, res, next) {
  try {
    const { return_date, return_quantity } = req.body;
    const current = await getIssueRecordById(req.params.id);
    if (!current) return res.status(404).json({ error: 'Record not found' });
    if (!['issued', 'due_for_disposal'].includes(current.status)) {
      return res.status(409).json({ error: `Cannot return a record with status '${current.status}'` });
    }
    const qty = Number(return_quantity) || 0;
    if (qty <= 0) {
      return res.status(400).json({ error: 'return_quantity must be greater than 0' });
    }
    const alreadyReturned = Number(current.return_quantity) || 0;
    const remaining = Number(current.quantity) - alreadyReturned;
    if (qty > remaining) {
      return res.status(400).json({ error: `return_quantity exceeds remaining quantity (${remaining})` });
    }
    const newReturnQty = alreadyReturned + qty;
    const newStatus = newReturnQty >= Number(current.quantity) ? 'returned' : 'issued';
    const record = await returnIssueRecord(req.params.id, return_date || localDate(), newReturnQty, newStatus);
    if (!record) return res.status(404).json({ error: 'Record not found' });
    res.json(record);
  } catch (error) {
    log.error(error);
    next(error);
  }
}

export async function getExpiring(req, res, next) {
  try {
    const months = parseInt(req.query.months) || 2;
    const items = await getExpiringItems(months);
    res.json(items);
  } catch (error) {
    log.error(error);
    next(error);
  }
}

export async function getIssue(req, res, next) {
  try {
    const record = await getIssueRecordById(req.params.id);
    if (!record) return res.status(404).json({ error: 'Issue record not found' });
    res.json(record);
  } catch (error) {
    log.error(error);
    next(error);
  }
}

export async function updateIssue(req, res, next) {
  try {
    const record = await updateIssueRecord(req.params.id, req.body);
    if (!record) return res.status(404).json({ error: 'Issue record not found' });
    res.json(record);
  } catch (error) {
    log.error(error);
    next(error);
  }
}

export async function deleteIssue(req, res, next) {
  try {
    const record = await deleteIssueRecord(req.params.id);
    if (!record) return res.status(404).json({ error: 'Issue record not found' });
    res.json({ message: 'Issue record deleted' });
  } catch (error) {
    log.error(error);
    next(error);
  }
}