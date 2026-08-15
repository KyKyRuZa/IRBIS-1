import { Router } from 'express';
import { getDemandReport, getNotifications, backupDatabase } from '../controllers/adminController.js';
import { authMiddleware, adminOnly } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);
router.use(adminOnly);

router.get('/demand', getDemandReport);
router.get('/notifications', getNotifications);
router.get('/backup', backupDatabase);

export default router;
