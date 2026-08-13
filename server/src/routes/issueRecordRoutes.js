import { Router } from 'express';
import {
  issueItem,
  listIssues,
  dispose,
  getExpiring
} from '../controllers/issueRecordController.js';

const router = Router();

router.post('/', issueItem);
router.get('/', listIssues);
router.patch('/:id/dispose', dispose);
router.get('/expiring', getExpiring);

export default router;