import { Router } from 'express';
import {
  addCertificate,
  listCertificates,
  listCertificatesByItem,
  getCertificate,
  updateCertificate,
  deleteCertificate
} from '../controllers/certificateController.js';
import { authMiddleware, adminOnly } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { CertificateSchema, CertificateUpdateSchema } from '../validation/index.js';

const router = Router();

router.use(authMiddleware);

router.post('/', adminOnly, validate(CertificateSchema), addCertificate);
router.get('/', listCertificates);
router.get('/item/:itemTypeId', listCertificatesByItem);
router.get('/:id', getCertificate);
router.put('/:id', adminOnly, validate(CertificateUpdateSchema), updateCertificate);
router.delete('/:id', adminOnly, deleteCertificate);

export default router;