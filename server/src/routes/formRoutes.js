import { Router } from 'express';
import {
  addForm,
  listForms,
  takeForm,
  listFormTaken,
  listFormTakenByEmployee
} from '../controllers/formController.js';

const router = Router();

router.post('/', addForm);
router.get('/', listForms);
router.post('/take', takeForm);
router.get('/taken', listFormTaken);
router.get('/taken/:employeeId', listFormTakenByEmployee);

export default router;