import { Router } from 'express'
import {
  registerEmployee,
  listEmployees,
  getEmployee,
  editEmployee,
  fireEmployee,
  deleteEmployee,
  getEmployeesSizesBySite,
} from '../controllers/employeeController.js'
import { validate, validateQuery } from '../middleware/validate.js'
import { authMiddleware, adminOnly, requireEmployeeId } from '../middleware/auth.js'
import { EmployeeSchema, EmployeeUpdateSchema, EmployeeListQuerySchema } from '../validation/index.js'

const router = Router()

router.use(authMiddleware)

router.post('/', adminOnly, validate(EmployeeSchema), registerEmployee)
router.get('/', adminOnly, validateQuery(EmployeeListQuerySchema), listEmployees)
router.get('/:id', requireEmployeeId, getEmployee)
router.put('/:id', adminOnly, validate(EmployeeUpdateSchema), editEmployee)
router.patch('/:id/terminate', adminOnly, fireEmployee)
router.delete('/:id', adminOnly, deleteEmployee)
router.get('/site/:siteId/sizes', adminOnly, getEmployeesSizesBySite)

export default router
