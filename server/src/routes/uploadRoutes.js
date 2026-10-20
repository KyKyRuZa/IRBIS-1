import { Router } from 'express';
import { uploadCertificate, uploadSignature } from '../controllers/uploadController.js';
import { authMiddleware, adminOnly } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { validate } from '../middleware/validate.js';
import { CertificateUploadSchema, SignatureUploadSchema } from '../validation/index.js';

const router = Router();

router.post('/certificate', authMiddleware, adminOnly, upload.single('certificate'), validate(CertificateUploadSchema), uploadCertificate);
router.post('/signature', authMiddleware, upload.single('signature'), validate(SignatureUploadSchema), uploadSignature);

export default router;
