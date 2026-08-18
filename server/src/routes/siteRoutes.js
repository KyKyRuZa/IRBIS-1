import { Router } from 'express';
import { addSite, listSites, getSite, updateSite, deleteSite } from '../controllers/siteController.js';

const router = Router();

router.post('/', addSite);
router.get('/', listSites);
router.get('/:id', getSite);
router.put('/:id', updateSite);
router.delete('/:id', deleteSite);

export default router;