import { Router } from 'express';
import { exportToExcel } from '../controllers/reportController.js';
import { exportEmployeeCard, exportConsumables, exportAllCards, exportIssuesReport, exportExpiringReport, exportItemsReport } from '../controllers/exportController.js';

const router = Router();

router.get('/excel', exportToExcel);
router.get('/employee-card/:id', exportEmployeeCard);
router.get('/consumables/:id', exportConsumables);
router.get('/all-cards', exportAllCards);
router.get('/issues-report', exportIssuesReport);
router.get('/expiring-report', exportExpiringReport);
router.get('/items-report', exportItemsReport);

export default router;
