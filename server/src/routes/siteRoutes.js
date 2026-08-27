import { Router } from 'express';
import { addSite, listSites, getSite, updateSite, deleteSite } from '../controllers/siteController.js';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { SiteSchema, SiteUpdateSchema } from '../validation/index.js';

const router = Router();

router.use(authMiddleware);

router.post('/', validate(SiteSchema), addSite);
router.get('/', listSites);
router.get('/:id', getSite);
router.put('/:id', validate(SiteUpdateSchema), updateSite);
router.delete('/:id', deleteSite);

export default router;