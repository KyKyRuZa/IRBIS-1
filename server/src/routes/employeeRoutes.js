import { Router } from 'express';
import { registerEmployee, listEmployees, getEmployee, editEmployee, fireEmployee, deleteEmployee } from '../controllers/employeeController.js';
import { validate } from '../middleware/validate.js';
import { EmployeeSchema } from '../validation/index.js';

const router = Router();

router.post('/', validate(EmployeeSchema), registerEmployee);
router.get('/', listEmployees);
router.get('/:id', getEmployee);
router.put('/:id', editEmployee);
router.patch('/:id/terminate', fireEmployee);
router.delete('/:id', deleteEmployee);

export default router;
