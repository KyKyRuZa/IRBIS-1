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
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { IssueRecordSchema, IssueBatchSchema, IssueRecordUpdateSchema, IssueReturnSchema } from '../validation/index.js';

const router = Router();

router.use(authMiddleware);

router.post('/', validate(IssueRecordSchema), issueItem);
router.post('/batch', validate(IssueBatchSchema), batchIssue);
router.get('/', listIssues);
router.get('/expiring', getExpiring);
router.get('/:id', getIssue);
router.put('/:id', validate(IssueRecordUpdateSchema), updateIssue);
router.delete('/:id', deleteIssue);
router.patch('/:id/dispose', dispose);
router.patch('/:id/return', validate(IssueReturnSchema), returnItem);

export default router;