import { Router } from 'express';
import { exportToExcel } from '../controllers/reportController.js';

const router = Router();

router.get('/excel', exportToExcel);

export default router;
