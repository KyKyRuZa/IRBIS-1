import { Router } from 'express';
import { addSite, listSites, getSite, updateSite, deleteSite } from '../controllers/siteController.js';
import { authMiddleware, adminOnly } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { SiteSchema, SiteUpdateSchema } from '../validation/index.js';

const router = Router();

router.use(authMiddleware);

router.post('/', adminOnly, validate(SiteSchema), addSite);
router.get('/', listSites);
router.get('/:id', getSite);
router.put('/:id', adminOnly, validate(SiteUpdateSchema), updateSite);
router.delete('/:id', adminOnly, deleteSite);

export default router;