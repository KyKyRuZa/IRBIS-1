import { Router } from 'express';
import {
  addForm,
  getForm,
  updateFormController,
  deleteFormController,
  listForms,
  takeForm,
  listFormTaken,
  listFormTakenByEmployee
} from '../controllers/formController.js';
import { authMiddleware, adminOnly } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { FormSchema, FormUpdateSchema, FormTakeSchema } from '../validation/index.js';

const router = Router();

router.use(authMiddleware);

router.post('/', adminOnly, validate(FormSchema), addForm);
router.get('/', listForms);
router.post('/take', validate(FormTakeSchema), takeForm);
router.get('/taken', listFormTaken);
router.get('/taken/:employeeId', listFormTakenByEmployee);
router.get('/:id', getForm);
router.put('/:id', adminOnly, validate(FormUpdateSchema), updateFormController);
router.delete('/:id', adminOnly, deleteFormController);

export default router;