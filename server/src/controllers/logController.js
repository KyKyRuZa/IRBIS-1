import { childLogger } from '../utils/logger.js';

const log = childLogger('clientLog');
const ALLOWED_LEVELS = new Set(['debug', 'info', 'warn', 'error']);

export function ingestClientLog(req, res, next) {
  try {
    const { level, message, module: mod, context } = req.body || {};
    const lvl = ALLOWED_LEVELS.has(level) ? level : 'info';
    log[lvl](
      { ...context, user: req.user?.username, ip: req.ip },
      `[client:${mod || 'browser'}] ${message || 'client log'}`
    );
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
