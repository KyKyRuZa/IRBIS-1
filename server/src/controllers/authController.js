import crypto from 'crypto';
import pool from '../models/db.js';
import bcrypt from 'bcrypt';
import { LoginSchema, RegisterSchema, ChangePasswordSchema } from '../validation/index.js';
import { childLogger } from '../utils/logger.js';

const log = childLogger('auth');

const DUMMY_HASH = '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZd9qJ6jFm';

async function verifyPassword(password, hash) {
  try {
    return await bcrypt.compare(password, hash);
  } catch {
    return false;
  }
}
import {
  signAccessToken,
  createRefreshToken,
  persistRefreshToken,
  revokeRefreshToken,
  findValidRefreshToken,
  buildCookieOptions,
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  publicUser,
} from '../utils/tokens.js';

export async function login(req, res, next) {
  try {
    const { username, password } = LoginSchema.parse(req.body);

    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];
    if (!user) {
      await verifyPassword(password, DUMMY_HASH);
      log.warn({ username }, 'Login failed: unknown user');
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      log.warn({ username }, 'Login failed: invalid password');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const accessToken = signAccessToken(user);
    const { raw, tokenHash, expiresAt } = createRefreshToken();
    await persistRefreshToken(user.id, tokenHash, expiresAt);

    res.cookie(ACCESS_COOKIE, accessToken, { ...buildCookieOptions(), maxAge: 15 * 60 * 1000 });
    res.cookie(REFRESH_COOKIE, raw, { ...buildCookieOptions(), maxAge: 7 * 24 * 60 * 60 * 1000 });

    log.info({ username: user.username, userId: user.id }, 'Login successful');
    res.json(publicUser(user));
  } catch (error) {
    log.error(error);
    next(error);
  }
}

export async function refresh(req, res, next) {
  try {
    const raw = req.cookies?.[REFRESH_COOKIE];
    if (!raw) {
      log.warn('Refresh failed: no refresh token');
      return res.status(401).json({ error: 'Refresh token required' });
    }
    const tokenHash = crypto.createHash('sha256').update(raw).digest('hex');
    const record = await findValidRefreshToken(tokenHash);
    if (!record) {
      log.warn('Refresh failed: invalid or expired refresh token');
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    const result = await pool.query('SELECT * FROM users WHERE id = $1', [record.userId]);
    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const accessToken = signAccessToken(user);
    const nextRefresh = createRefreshToken();
    await revokeRefreshToken(tokenHash);
    await persistRefreshToken(user.id, nextRefresh.tokenHash, nextRefresh.expiresAt);

    res.cookie(ACCESS_COOKIE, accessToken, { ...buildCookieOptions(), maxAge: 15 * 60 * 1000 });
    res.cookie(REFRESH_COOKIE, nextRefresh.raw, { ...buildCookieOptions(), maxAge: 7 * 24 * 60 * 60 * 1000 });

    log.info({ userId: user.id }, 'Access token refreshed');
    res.json(publicUser(user));
  } catch (error) {
    log.error(error);
    next(error);
  }
}

export async function logout(req, res, next) {
  try {
    const raw = req.cookies?.[REFRESH_COOKIE];
    if (raw) {
      const tokenHash = crypto.createHash('sha256').update(raw).digest('hex');
      await revokeRefreshToken(tokenHash);
    }
    res.clearCookie(ACCESS_COOKIE, buildCookieOptions());
    res.clearCookie(REFRESH_COOKIE, buildCookieOptions());
    log.info({ userId: req.user?.id }, 'User logged out');
    res.json({ message: 'Logged out' });
  } catch (error) {
    log.error(error);
    next(error);
  }
}

export async function me(req, res, next) {
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    res.json(publicUser(user));
  } catch (error) {
    log.error(error);
    next(error);
  }
}

export async function register(req, res, next) {
  try {
    const { username, password, role } = RegisterSchema.parse(req.body);

    const existing = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3) RETURNING *',
      [username, hash, role || 'user']
    );
    res.status(201).json({ id: result.rows[0].id, username: result.rows[0].username, role: result.rows[0].role });
    log.info({ username, role: role || 'user' }, 'User registered');
  } catch (error) {
    log.error(error);
    next(error);
  }
}

export async function changePassword(req, res, next) {
  try {
    const { old_password, new_password } = ChangePasswordSchema.parse(req.body);
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    const user = result.rows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });
    const valid = await verifyPassword(old_password, user.password_hash);
    if (!valid) {
      log.warn({ userId }, 'Change password failed: invalid old password');
      return res.status(401).json({ error: 'Invalid old password' });
    }
    const hash = await bcrypt.hash(new_password, 10);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, userId]);
    log.info({ userId }, 'Password changed');
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    log.error(error);
    next(error);
  }
}
