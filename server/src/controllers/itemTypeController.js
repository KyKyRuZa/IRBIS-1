import {
  createItemType,
  getAllItemTypes,
  getItemTypeById,
  updateItemType,
  deleteItemType
} from '../models/itemTypeModel.js';
import pool from '../models/db.js';

export async function addItem(req, res, next) {
  try {
    const { name, category, unit, default_wear_time, seasonality, requires_certificate } = req.body;
    if (!name || !category) {
      return res.status(400).json({ error: 'name and category are required' });
    }
    const item = await createItemType(name, category, unit, default_wear_time, seasonality, requires_certificate);
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
}

export async function listItems(req, res, next) {
  try {
    const { category, requires_certificate } = req.query;
    let query = 'SELECT * FROM item_types';
    const conditions = [];
    const params = [];
    
    if (category) {
      conditions.push(`category = $${params.length + 1}`);
      params.push(category);
    }
    if (requires_certificate !== undefined) {
      conditions.push(`requires_certificate = $${params.length + 1}`);
      params.push(requires_certificate === 'true');
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY name';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
}

export async function getItem(req, res, next) {
  try {
    const item = await getItemTypeById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item type not found' });
    res.json(item);
  } catch (error) {
    next(error);
  }
}

export async function updateItem(req, res, next) {
  try {
    const item = await updateItemType(req.params.id, req.body);
    if (!item) return res.status(404).json({ error: 'Item type not found' });
    res.json(item);
  } catch (error) {
    next(error);
  }
}

export async function deleteItem(req, res, next) {
  try {
    const item = await deleteItemType(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item type not found' });
    res.json({ message: 'Item type deleted' });
  } catch (error) {
    next(error);
  }
}
