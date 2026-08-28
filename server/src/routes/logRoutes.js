import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { ingestClientLog } from '../controllers/logController.js';

const router = express.Router();

router.post('/', authMiddleware, ingestClientLog);

export default router;
