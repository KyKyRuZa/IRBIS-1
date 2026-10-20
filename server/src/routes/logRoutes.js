import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { ingestClientLog } from '../controllers/logController.js';
import { validate } from '../middleware/validate.js';
import { ClientLogSchema } from '../validation/index.js';

const router = express.Router();

router.post('/', authMiddleware, validate(ClientLogSchema), ingestClientLog);

export default router;
