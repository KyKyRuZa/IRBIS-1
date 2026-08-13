import { Router } from 'express';
import { registerEmployee, listEmployees, getEmployee, editEmployee, fireEmployee } from '../controllers/employeeController.js';

const router = Router();

router.post('/', registerEmployee);
router.get('/', listEmployees);
router.get('/:id', getEmployee);
router.put('/:id', editEmployee);
router.patch('/:id/terminate', fireEmployee);

export default router;