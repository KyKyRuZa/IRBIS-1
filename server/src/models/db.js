import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { getRequestLogger } from '../utils/logger.js'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const pool = {
  async query(text, params = []) {
    try {
      const isSelectOrReturning = /\bSELECT\b/i.test(text) || /\bRETURNING\b/i.test(text)
      if (isSelectOrReturning) {
        const rows = await prisma.$queryRawUnsafe(text, ...params)
        const normalized = Array.isArray(rows) ? rows : rows == null ? [] : [rows]
        return { rows: normalized, rowCount: normalized.length }
      }
      const result = await prisma.$executeRawUnsafe(text, ...params)
      const rowCount = typeof result === 'object' && result !== null ? result.count : result
      return { rows: [], rowCount: Number(rowCount) || 0 }
    } catch (err) {
      const logData = { err }
      if (process.env.NODE_ENV !== 'production') {
        logData.sql = text
      }
      getRequestLogger().error(logData, 'Database query failed')
      throw err
    }
  },

  async end() {
    await prisma.$disconnect()
  },
}

export async function initDB() {
  await prisma.$connect()
}

export default pool
export { prisma, pool }
