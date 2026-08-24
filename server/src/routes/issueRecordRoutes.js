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

const router = Router();

router.post('/', issueItem);
router.post('/batch', batchIssue);
router.get('/', listIssues);
router.get('/expiring', getExpiring);
router.get('/:id', getIssue);
router.put('/:id', updateIssue);
router.delete('/:id', deleteIssue);
router.patch('/:id/dispose', dispose);
router.patch('/:id/return', returnItem);

export default router;