import { Router } from 'express';
import {
  addCertificate,
  listCertificates,
  listCertificatesByItem,
  getCertificate,
  updateCertificate,
  deleteCertificate
} from '../controllers/certificateController.js';

const router = Router();

router.post('/', addCertificate);
router.get('/', listCertificates);
router.get('/:id', getCertificate);
router.put('/:id', updateCertificate);
router.delete('/:id', deleteCertificate);
router.get('/item/:itemTypeId', listCertificatesByItem);

export default router;