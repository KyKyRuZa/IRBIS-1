import { z } from 'zod';

export function validate(schema) {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req.body);
      req.body = parsed;
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: err.issues.map(e => e.message).join(', ') });
      }
      return res.status(400).json({ error: 'Validation failed' });
    }
  };
}
