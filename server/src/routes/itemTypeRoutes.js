import { Router } from 'express';
import { addItem, listItems, getItem, updateItem, deleteItem } from '../controllers/itemTypeController.js';
import { listCertificatesByItem } from '../controllers/certificateController.js';

const router = Router();

router.post('/', addItem);
router.get('/', listItems);
router.get('/:id', getItem);
router.put('/:id', updateItem);
router.delete('/:id', deleteItem);

export default router;