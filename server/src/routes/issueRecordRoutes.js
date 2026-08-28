import { Router } from 'express';
import {
  issueItem,
  batchIssue,
  listIssues,
  dispose,
  returnItem,
  getExpiring,
  getIssue,
  updateIssue,
  deleteIssue
} from '../controllers/issueRecordController.js';
import { authMiddleware, adminOnly } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { IssueRecordSchema, IssueBatchSchema, IssueRecordUpdateSchema, IssueReturnSchema } from '../validation/index.js';

const router = Router();

router.use(authMiddleware);

router.post('/', adminOnly, validate(IssueRecordSchema), issueItem);
router.post('/batch', adminOnly, validate(IssueBatchSchema), batchIssue);
router.get('/', listIssues);
router.get('/expiring', getExpiring);
router.get('/:id', getIssue);
router.put('/:id', adminOnly, validate(IssueRecordUpdateSchema), updateIssue);
router.delete('/:id', adminOnly, deleteIssue);
router.patch('/:id/dispose', adminOnly, dispose);
router.patch('/:id/return', adminOnly, validate(IssueReturnSchema), returnItem);

export default router;