import { z } from 'zod';
import { childLogger } from '../utils/logger.js';

const log = childLogger('validate');

export function validate(schema) {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req.body);
      req.body = parsed;
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        log.warn({ path: req.path, issues: err.issues.map(e => e.path.join('.')) }, 'Validation failed');
        return res.status(400).json({ error: err.issues.map(e => e.message).join(', ') });
      }
      return res.status(400).json({ error: 'Validation failed' });
    }
  };
}
