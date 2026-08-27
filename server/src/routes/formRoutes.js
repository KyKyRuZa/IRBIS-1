import { Router } from 'express';
import {
  addForm,
  listForms,
  takeForm,
  listFormTaken,
  listFormTakenByEmployee
} from '../controllers/formController.js';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { FormSchema, FormTakeSchema } from '../validation/index.js';

const router = Router();

router.use(authMiddleware);

router.post('/', validate(FormSchema), addForm);
router.get('/', listForms);
router.post('/take', validate(FormTakeSchema), takeForm);
router.get('/taken', listFormTaken);
router.get('/taken/:employeeId', listFormTakenByEmployee);

export default router;