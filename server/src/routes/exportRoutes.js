import { Router } from 'express';
import { exportToExcel, exportDemandReport, exportIssuesReport, exportExpiringReport } from '../controllers/reportController.js';
import { exportEmployeeCard, exportConsumables, exportAllCards, exportItemsReport, exportGroupConsumablesReport } from '../controllers/exportController.js';

const router = Router();

router.get('/excel', exportToExcel);
router.get('/demand/excel', exportDemandReport);
router.get('/employee-card/:id', exportEmployeeCard);
router.get('/consumables/:id', exportConsumables);
router.get('/all-cards', exportAllCards);
router.get('/issues-report', exportIssuesReport);
router.get('/expiring-report', exportExpiringReport);
router.get('/items-report', exportItemsReport);
router.get('/group-consumables', exportGroupConsumablesReport);

export default router;
