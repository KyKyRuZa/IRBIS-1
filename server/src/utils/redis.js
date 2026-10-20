import { createClient } from 'redis';
import { logger } from './logger.js';

let redisClient = null;

if (process.env.REDIS_URL) {
  redisClient = createClient({ url: process.env.REDIS_URL });
  redisClient.on('error', (err) => logger.error({ err }, 'Redis client error'));
  redisClient.on('connect', () => logger.info('Redis client connected'));
  redisClient.on('reconnecting', () => logger.info('Redis client reconnecting'));
}

export { redisClient };

export async function acquireLock(key, ttlMs) {
  if (!redisClient) return null;
  const token = crypto.randomUUID();
  try {
    const result = await redisClient.set(key, token, { NX: true, PX: ttlMs });
    if (result === null) return null;
    return token;
  } catch (err) {
    logger.error({ err, key }, 'Failed to acquire Redis lock');
    return null;
  }
}

export async function releaseLock(key, token) {
  if (!redisClient || !token) return false;
  try {
    const script =
      'if redis.call("get", KEYS[1]) == ARGV[1] then return redis.call("del", KEYS[1]) else return 0 end';
    const result = await redisClient.eval(script, { keys: [key], arguments: [token] });
    return result === 1;
  } catch (err) {
    logger.error({ err, key }, 'Failed to release Redis lock');
    return false;
  }
}

export async function disconnectRedis() {
  if (redisClient) {
    await redisClient.quit();
    logger.info('Redis client disconnected');
  }
}
