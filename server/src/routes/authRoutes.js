import { Router } from 'express';
import { login, register, changePassword } from '../controllers/authController.js';
import { validate } from '../middleware/validate.js';
import { LoginSchema, RegisterSchema, ChangePasswordSchema } from '../validation/index.js';

const router = Router();

router.post('/login', validate(LoginSchema), login);
router.post('/register', validate(RegisterSchema), register);
router.post('/change-password', validate(ChangePasswordSchema), changePassword);

export default router;
