import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { prisma } from '../models/db.js';
import { childLogger } from './logger.js';

const log = childLogger('tokens');

const ACCESS_TTL = '15m';
const REFRESH_TTL_DAYS = 7;

const isProd = process.env.NODE_ENV === 'production';
const cookieSecure = process.env.COOKIE_SECURE ? process.env.COOKIE_SECURE === 'true' : isProd;

export const ACCESS_COOKIE = 'access_token';
export const REFRESH_COOKIE = 'refresh_token';

export function buildCookieOptions() {
  return {
    httpOnly: true,
    secure: cookieSecure,
    sameSite: 'strict',
    path: '/api',
  };
}

export function signAccessToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TTL }
  );
}

export function createRefreshToken() {
  const raw = crypto.randomBytes(40).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(raw).digest('hex');
  const expiresAt = new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);
  return { raw, tokenHash, expiresAt };
}

export async function persistRefreshToken(userId, tokenHash, expiresAt) {
  return prisma.refreshToken.create({
    data: { userId, tokenHash, expiresAt },
  });
}

export async function revokeRefreshToken(tokenHash) {
  await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function findValidRefreshToken(tokenHash) {
  const record = await prisma.refreshToken.findFirst({
    where: { tokenHash, revokedAt: null },
  });
  if (!record) return null;
  if (record.expiresAt.getTime() < Date.now()) {
    await revokeRefreshToken(tokenHash);
    log.warn({ userId: record.userId }, 'Refresh token expired, revoked');
    return null;
  }
  return record;
}

export function publicUser(user) {
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    push_enabled: Boolean(user.push_enabled),
  };
}
