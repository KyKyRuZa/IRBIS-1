import { Router } from 'express';
import { exportToExcel, exportDemandReport, exportIssuesReport, exportExpiringReport } from '../controllers/reportController.js';
import { getDemandReport } from '../controllers/adminController.js';
import { authMiddleware, adminOnly } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);
router.use(adminOnly);

router.get('/excel', exportToExcel);
router.get('/demand', getDemandReport);
router.get('/demand/excel', exportDemandReport);
router.get('/issues-report', exportIssuesReport);
router.get('/expiring-report', exportExpiringReport);

export default router;
