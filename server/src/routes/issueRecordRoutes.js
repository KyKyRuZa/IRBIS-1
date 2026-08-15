import { Router } from 'express';
import {
  issueItem,
  batchIssue,
  listIssues,
  dispose,
  returnItem,
  getExpiring
} from '../controllers/issueRecordController.js';

const router = Router();

router.post('/', issueItem);
router.post('/batch', batchIssue);
router.get('/', listIssues);
router.patch('/:id/dispose', dispose);
router.patch('/:id/return', returnItem);
router.get('/expiring', getExpiring);

export default router;