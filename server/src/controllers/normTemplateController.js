import { childLogger } from '../utils/logger.js'
const log = childLogger('normTemplate')

import {
  getAllNormTemplates,
  getNormTemplateById,
  createNormTemplate,
  updateNormTemplate,
  deleteNormTemplate,
  createNormTemplateItem,
  getNormTemplateItems,
  deleteNormTemplateItem,
} from '../models/normTemplateModel.js'

export async function listTemplates(req, res, next) {
  try {
    const templates = await getAllNormTemplates()
    res.json(templates)
  } catch (error) {
    log.error(error)
    next(error)
  }
}

export async function getTemplate(req, res, next) {
  try {
    const template = await getNormTemplateById(req.params.id)
    if (!template) return res.status(404).json({ error: 'Шаблон не найден' })
    res.json(template)
  } catch (error) {
    log.error(error)
    next(error)
  }
}

export async function addTemplate(req, res, next) {
  try {
    const template = await createNormTemplate(req.body)
    res.status(201).json(template)
  } catch (error) {
    log.error(error)
    next(error)
  }
}

export async function updateTemplate(req, res, next) {
  try {
    const template = await updateNormTemplate(req.params.id, req.body)
    if (!template) return res.status(404).json({ error: 'Шаблон не найден' })
    res.json(template)
  } catch (error) {
    log.error(error)
    next(error)
  }
}

export async function deleteTemplate(req, res, next) {
  try {
    const template = await deleteNormTemplate(req.params.id)
    if (!template) return res.status(404).json({ error: 'Шаблон не найден' })
    res.json({ message: 'Шаблон удалён' })
  } catch (error) {
    log.error(error)
    next(error)
  }
}

export async function listTemplateItems(req, res, next) {
  try {
    const items = await getNormTemplateItems(req.params.id)
    res.json(items)
  } catch (error) {
    log.error(error)
    next(error)
  }
}

export async function addItemToTemplate(req, res, next) {
  try {
    const item = await createNormTemplateItem(req.params.id, req.body)
    res.status(201).json(item)
  } catch (error) {
    log.error(error)
    next(error)
  }
}

export async function removeItemFromTemplate(req, res, next) {
  try {
    const item = await deleteNormTemplateItem(req.params.itemId)
    if (!item) return res.status(404).json({ error: 'Элемент шаблона не найден' })
    res.json({ message: 'Элемент удалён' })
  } catch (error) {
    log.error(error)
    next(error)
  }
}
