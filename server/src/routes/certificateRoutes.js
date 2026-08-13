import { Router } from 'express';
import {
  addCertificate,
  listCertificates,
  listCertificatesByItem
} from '../controllers/certificateController.js';

const router = Router();

router.post('/', addCertificate);
router.get('/', listCertificates);
router.get('/item/:itemTypeId', listCertificatesByItem);

export default router;