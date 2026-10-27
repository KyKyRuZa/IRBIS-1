import { Router } from 'express'
import {
  listTemplates,
  getTemplate,
  addTemplate,
  updateTemplate,
  deleteTemplate,
  listTemplateItems,
  addItemToTemplate,
  removeItemFromTemplate,
  getTemplatesForPosition,
} from '../controllers/normTemplateController.js'
import { authMiddleware, adminOnly } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { NormTemplateSchema, NormTemplateItemSchema, NormTemplateUpdateSchema } from '../validation/index.js'

const router = Router()

router.use(authMiddleware)

router.get('/', listTemplates)
router.post('/', adminOnly, validate(NormTemplateSchema), addTemplate)
router.get('/by-position/:position', getTemplatesForPosition)

router.get('/:id', getTemplate)
router.put('/:id', adminOnly, validate(NormTemplateUpdateSchema), updateTemplate)
router.delete('/:id', adminOnly, deleteTemplate)

router.get('/:id/items', listTemplateItems)
router.post('/:id/items', adminOnly, validate(NormTemplateItemSchema), addItemToTemplate)
router.delete('/:id/items/:itemId', adminOnly, removeItemFromTemplate)

export default router
