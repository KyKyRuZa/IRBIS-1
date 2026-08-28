import jwt from 'jsonwebtoken';
import pool from '../models/db.js';
import { childLogger } from '../utils/logger.js';

const log = childLogger('authMiddleware');

export function cookiesMiddleware(req, res, next) {
  const header = req.headers.cookie;
  req.cookies = {};
  if (!header) return next();
  for (const pair of header.split(';')) {
    const idx = pair.indexOf('=');
    if (idx === -1) continue;
    const key = pair.slice(0, idx).trim();
    const value = pair.slice(idx + 1).trim();
    if (key) req.cookies[key] = decodeURIComponent(value);
  }
  next();
}

export function authMiddleware(req, res, next) {
  const cookieToken = req.cookies?.access_token;
  const headerToken = req.headers.authorization?.replace('Bearer ', '');
  const token = cookieToken || headerToken;
  if (!token) {
    log.warn({ ip: req.ip }, 'Auth rejected: missing token');
    return res.status(401).json({ error: 'Authorization token required' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id, username: decoded.username, role: decoded.role };
    next();
  } catch (err) {
    log.warn({ ip: req.ip }, 'Auth rejected: invalid or expired token');
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') {
    log.warn({ username: req.user?.username, role: req.user?.role }, 'Admin-only route denied');
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

export async function registerGuard(req, res, next) {
  const token = req.cookies?.access_token || req.headers.authorization?.replace('Bearer ', '');
  if (token) {
    return authMiddleware(req, res, () => adminOnly(req, res, next));
  }
  try {
    const { rows } = await pool.query('SELECT COUNT(*)::int AS count FROM users');
    if (rows[0].count === 0) {
      req.body = { ...req.body, role: 'admin' };
      return next();
    }
    return res.status(401).json({ error: 'Authentication required' });
  } catch (err) {
    next(err);
  }
}
