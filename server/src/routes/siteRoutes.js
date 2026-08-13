import { Router } from 'express';
import { addSite, listSites } from '../controllers/siteController.js';

const router = Router();

router.post('/', addSite);
router.get('/', listSites);

export default router;