import { Router } from 'express';
import { login, changePassword, refresh, logout, me } from '../controllers/authController.js';
import { validate } from '../middleware/validate.js';
import { authMiddleware } from '../middleware/auth.js';
import { LoginSchema, ChangePasswordSchema } from '../validation/index.js';

const router = Router();

router.post('/login', validate(LoginSchema), login);
router.post('/change-password', validate(ChangePasswordSchema), authMiddleware, changePassword);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', authMiddleware, me);

export default router;
