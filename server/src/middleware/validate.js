import { z } from 'zod'
import { childLogger } from '../utils/logger.js'
import { cleanupUploadedFile } from './upload.js'

const log = childLogger('validate')

function cleanupMulterFile(req) {
  if (req.file) cleanupUploadedFile(req.file).catch(() => {})
  if (req.files) {
    for (const arr of Object.values(req.files)) {
      for (const f of arr) cleanupUploadedFile(f).catch(() => {})
    }
  }
}

export function validate(schema) {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req.body)
      req.body = parsed
      next()
    } catch (err) {
      cleanupMulterFile(req)
      if (err instanceof z.ZodError) {
        log.warn(
          { path: req.path, issues: err.issues.map((e) => e.path.join('.')) },
          'Validation failed'
        )
        return res.status(400).json({
          error: 'Validation failed',
          issues: err.issues.map((e) => ({
            path: e.path,
            message: e.message,
            code: e.code,
          })),
        })
      }
      return res.status(400).json({ error: 'Validation failed' })
    }
  }
}

export function validateQuery(schema) {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req.query)
      req.query = parsed
      next()
    } catch (err) {
      if (err instanceof z.ZodError) {
        log.warn(
          { path: req.path, issues: err.issues.map((e) => e.path.join('.')) },
          'Query validation failed'
        )
        return res.status(400).json({
          error: 'Validation failed',
          issues: err.issues.map((e) => ({
            path: e.path,
            message: e.message,
            code: e.code,
          })),
        })
      }
      return res.status(400).json({ error: 'Validation failed' })
    }
  }
}
