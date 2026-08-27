import { Router } from 'express';
import { registerEmployee, listEmployees, getEmployee, editEmployee, fireEmployee, deleteEmployee } from '../controllers/employeeController.js';
import { validate } from '../middleware/validate.js';
import { authMiddleware } from '../middleware/auth.js';
import { EmployeeSchema, EmployeeUpdateSchema } from '../validation/index.js';

const router = Router();

router.use(authMiddleware);

router.post('/', validate(EmployeeSchema), registerEmployee);
router.get('/', listEmployees);
router.get('/:id', getEmployee);
router.put('/:id', validate(EmployeeUpdateSchema), editEmployee);
router.patch('/:id/terminate', fireEmployee);
router.delete('/:id', deleteEmployee);

export default router;
