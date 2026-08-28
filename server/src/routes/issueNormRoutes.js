import { Router } from 'express';
import { addNorm, listNorms, getNorm, updateNorm, deleteNorm, getEmployeeNorms } from '../controllers/issueNormController.js';
import { authMiddleware, adminOnly } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { IssueNormSchema, IssueNormUpdateSchema } from '../validation/index.js';

const router = Router();

router.use(authMiddleware);

router.post('/', adminOnly, validate(IssueNormSchema), addNorm);
router.get('/', listNorms);
router.get('/:id', getNorm);
router.put('/:id', adminOnly, validate(IssueNormUpdateSchema), updateNorm);
router.delete('/:id', adminOnly, deleteNorm);
router.get('/employee/:employeeId', getEmployeeNorms);

export default router;