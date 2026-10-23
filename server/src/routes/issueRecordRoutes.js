import { Router } from 'express'
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
  deleteIssue,
} from '../controllers/issueRecordController.js'
import { authMiddleware, adminOnly, requireEmployeeId } from '../middleware/auth.js'
import { validate, validateQuery } from '../middleware/validate.js'
import {
  IssueRecordSchema,
  IssueBatchSchema,
  IssueBatchSingleSchema,
  IssueRecordUpdateSchema,
  IssueReturnSchema,
  IssueListQuerySchema,
  ExpiringQuerySchema,
} from '../validation/index.js'

const router = Router()

router.use(authMiddleware)

router.post('/', adminOnly, validate(IssueRecordSchema), issueItem)
router.post('/batch', adminOnly, validate(IssueBatchSchema), batchIssue)
router.post('/batch-single', adminOnly, validate(IssueBatchSingleSchema), batchIssueSingle)
router.get('/', requireEmployeeId, validateQuery(IssueListQuerySchema), listIssues)
router.get('/expiring', adminOnly, validateQuery(ExpiringQuerySchema), getExpiring)
router.get('/:id', requireEmployeeId, getIssue)
router.put('/:id', adminOnly, validate(IssueRecordUpdateSchema), updateIssue)
router.delete('/:id', adminOnly, deleteIssue)
router.patch('/:id/dispose', adminOnly, dispose)
router.patch('/:id/return', adminOnly, validate(IssueReturnSchema), returnItem)

export default router
