import { Router } from 'express';
import { uploadCertificate, uploadSignature } from '../controllers/uploadController.js';
import { authMiddleware, adminOnly } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();

router.post('/certificate', authMiddleware, adminOnly, upload.single('certificate'), uploadCertificate);
router.post('/signature', authMiddleware, upload.single('signature'), uploadSignature);

export default router;
