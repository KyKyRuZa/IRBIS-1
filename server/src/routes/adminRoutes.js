import { Router } from 'express';
import { getDemandReport, getNotifications, markNotificationRead, markAllNotificationsRead, backupDatabase } from '../controllers/adminController.js';
import { authMiddleware, adminOnly } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);
router.use(adminOnly);

router.get('/demand', getDemandReport);
router.get('/notifications', getNotifications);
router.patch('/notifications/:id/read', markNotificationRead);
router.patch('/notifications/read-all', markAllNotificationsRead);
router.get('/backup', backupDatabase);

export default router;
