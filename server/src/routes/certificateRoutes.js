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
router.get('/item/:itemTypeId', listCertificatesByItem);
router.get('/:id', getCertificate);
router.put('/:id', updateCertificate);
router.delete('/:id', deleteCertificate);

export default router;