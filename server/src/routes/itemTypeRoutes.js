import { Router } from 'express';
import { addItem, listItems, getItem, updateItem, deleteItem } from '../controllers/itemTypeController.js';
import { listCertificatesByItem } from '../controllers/certificateController.js';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { ItemTypeSchema, ItemTypeUpdateSchema } from '../validation/index.js';

const router = Router();

router.use(authMiddleware);

router.post('/', validate(ItemTypeSchema), addItem);
router.get('/', listItems);
router.get('/:id', getItem);
router.put('/:id', validate(ItemTypeUpdateSchema), updateItem);
router.delete('/:id', deleteItem);

export default router;