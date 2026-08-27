import { Router } from 'express';
import {
  addCertificate,
  listCertificates,
  listCertificatesByItem,
  getCertificate,
  updateCertificate,
  deleteCertificate
} from '../controllers/certificateController.js';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { CertificateSchema, CertificateUpdateSchema } from '../validation/index.js';

const router = Router();

router.use(authMiddleware);

router.post('/', validate(CertificateSchema), addCertificate);
router.get('/', listCertificates);
router.get('/item/:itemTypeId', listCertificatesByItem);
router.get('/:id', getCertificate);
router.put('/:id', validate(CertificateUpdateSchema), updateCertificate);
router.delete('/:id', deleteCertificate);

export default router;