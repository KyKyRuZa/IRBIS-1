import { Router } from 'express';
import {
  issueItem,
  batchIssue,
  batchIssueSingle,
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
import { IssueRecordSchema, IssueBatchSchema, IssueBatchSingleSchema, IssueRecordUpdateSchema, IssueReturnSchema } from '../validation/index.js';

const router = Router();

router.use(authMiddleware);

router.post('/', adminOnly, validate(IssueRecordSchema), issueItem);
router.post('/batch', adminOnly, validate(IssueBatchSchema), batchIssue);
router.post('/batch-single', adminOnly, validate(IssueBatchSingleSchema), batchIssueSingle);
router.get('/', adminOnly, listIssues);
router.get('/expiring', adminOnly, getExpiring);
router.get('/:id', adminOnly, getIssue);
router.put('/:id', adminOnly, validate(IssueRecordUpdateSchema), updateIssue);
router.delete('/:id', adminOnly, deleteIssue);
router.patch('/:id/dispose', adminOnly, dispose);
router.patch('/:id/return', adminOnly, validate(IssueReturnSchema), returnItem);

export default router;