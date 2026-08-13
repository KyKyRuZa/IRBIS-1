import { Router } from 'express';
import { addNorm, listNorms, getEmployeeNorms } from '../controllers/issueNormController.js';

const router = Router();

router.post('/', addNorm);
router.get('/', listNorms);
router.get('/employee/:employeeId', getEmployeeNorms);

export default router;