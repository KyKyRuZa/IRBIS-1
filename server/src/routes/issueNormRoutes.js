import { Router } from 'express';
import { addNorm, listNorms, getNorm, updateNorm, deleteNorm, getEmployeeNorms } from '../controllers/issueNormController.js';

const router = Router();

router.post('/', addNorm);
router.get('/', listNorms);
router.get('/:id', getNorm);
router.put('/:id', updateNorm);
router.delete('/:id', deleteNorm);
router.get('/employee/:employeeId', getEmployeeNorms);

export default router;