import { Router } from 'express';
import {
  subscribePush,
  unsubscribePush,
  sendPushToEmployee,
  sendPushToAll,
  sendTestPush,
  getVapidPublicKey,
  getPushPreferences,
  updatePushPreferences,
} from '../controllers/pushController.js';
import { authMiddleware, adminOnly } from '../middleware/auth.js';

const router = Router();

router.get('/vapid-public-key', getVapidPublicKey);
router.get('/preferences', authMiddleware, getPushPreferences);
router.patch('/preferences', authMiddleware, updatePushPreferences);
router.post('/subscribe', authMiddleware, subscribePush);
router.post('/unsubscribe', authMiddleware, unsubscribePush);
router.post('/test', authMiddleware, sendTestPush);
router.post('/send', authMiddleware, adminOnly, sendPushToEmployee);
router.post('/send-all', authMiddleware, adminOnly, sendPushToAll);

export default router;
