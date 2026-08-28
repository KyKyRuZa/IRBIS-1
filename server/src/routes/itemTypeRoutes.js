import { Router } from 'express';
import { addItem, listItems, getItem, updateItem, deleteItem } from '../controllers/itemTypeController.js';
import { listCertificatesByItem } from '../controllers/certificateController.js';
import { authMiddleware, adminOnly } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { ItemTypeSchema, ItemTypeUpdateSchema } from '../validation/index.js';

const router = Router();

router.use(authMiddleware);

router.post('/', adminOnly, validate(ItemTypeSchema), addItem);
router.get('/', listItems);
router.get('/:id', getItem);
router.put('/:id', adminOnly, validate(ItemTypeUpdateSchema), updateItem);
router.delete('/:id', adminOnly, deleteItem);

export default router;