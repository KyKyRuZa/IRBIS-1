import { Router } from 'express';
import { registerEmployee, listEmployees, getEmployee, editEmployee, fireEmployee, deleteEmployee } from '../controllers/employeeController.js';
import { validate } from '../middleware/validate.js';
import { authMiddleware, adminOnly } from '../middleware/auth.js';
import { EmployeeSchema, EmployeeUpdateSchema } from '../validation/index.js';

const router = Router();

router.use(authMiddleware);

router.post('/', adminOnly, validate(EmployeeSchema), registerEmployee);
router.get('/', listEmployees);
router.get('/:id', getEmployee);
router.put('/:id', adminOnly, validate(EmployeeUpdateSchema), editEmployee);
router.patch('/:id/terminate', adminOnly, fireEmployee);
router.delete('/:id', adminOnly, deleteEmployee);

export default router;
