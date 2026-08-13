import {
  createIssueRecord,
  getAllIssueRecords,
  getIssueRecordsByEmployee,
  getIssueRecordsBySite,
  disposeIssueRecord,
  getExpiringItems
} from '../models/issueRecordModel.js';
import pool from '../models/db.js';

export async function issueItem(req, res) {
  try {
    const { employee_id, item_type_id, quantity, issue_date, certificate_id } = req.body;
    if (!employee_id || !item_type_id) {
      return res.status(400).json({ error: 'employee_id and item_type_id are required' });
    }
    const item = await pool.query('SELECT * FROM item_types WHERE id = $1', [item_type_id]);
    if (!item.rows[0]) return res.status(404).json({ error: 'Item type not found' });
    
    let expiryDate = null;
    if (item.rows[0].default_wear_time_months) {
      const issueDate = issue_date ? new Date(issue_date) : new Date();
      expiryDate = new Date(issueDate);
      expiryDate.setMonth(expiryDate.getMonth() + item.rows[0].default_wear_time_months);
    }
    
    const record = await createIssueRecord(employee_id, item_type_id, quantity || 1, issue_date, expiryDate, certificate_id);
    res.status(201).json(record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function listIssues(req, res) {
  try {
    const { employee_id, site_id } = req.query;
    let records;
    
    if (employee_id) {
      records = await getIssueRecordsByEmployee(employee_id);
    } else if (site_id) {
      records = await getIssueRecordsBySite(site_id);
    } else {
      records = await getAllIssueRecords();
    }
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function dispose(req, res) {
  try {
    const record = await disposeIssueRecord(req.params.id);
    if (!record) return res.status(404).json({ error: 'Record not found' });
    res.json(record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function getExpiring(req, res) {
  try {
    const months = parseInt(req.query.months) || 2;
    const items = await getExpiringItems(months);
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}