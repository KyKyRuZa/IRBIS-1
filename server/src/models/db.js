import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { getRequestLogger } from '../utils/logger.js';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const pool = {
  async query(text, params = []) {
    try {
      const rows = await prisma.$queryRawUnsafe(text, ...params);
      const normalized = Array.isArray(rows) ? rows : rows == null ? [] : [rows];
      return { rows: normalized, rowCount: normalized.length };
    } catch (err) {
      getRequestLogger().error({ err, sql: text }, 'Database query failed');
      throw err;
    }
  },

  async end() {
    await prisma.$disconnect();
  },
};


export async function initDB() {
  await prisma.$connect();
}

export default pool;
export { prisma, pool };
