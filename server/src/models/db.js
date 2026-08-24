import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

/**
 * Lightweight `pg`-compatible shim backed by Prisma's raw query engine.
 *
 * The rest of the codebase talks to the database exclusively through
 * `pool.query(sql, params)`. After the migration to Prisma we keep that
 * exact contract so controllers/models/services don't need to change, but
 * the queries are now executed by Prisma against a schema managed through
 * Prisma migrations (`prisma/migrations`).
 *
 * Raw SQL results are keyed by their column names (snake_case), so the
 * existing API contract is preserved unchanged.
 */
const pool = {
  async query(text, params = []) {
    const rows = await prisma.$queryRawUnsafe(text, ...params);
    const normalized = Array.isArray(rows) ? rows : rows == null ? [] : [rows];
    return { rows: normalized, rowCount: normalized.length };
  },

  async end() {
    await prisma.$disconnect();
  },
};

/**
 * Replaces the old `initDB()` which created tables with raw SQL.
 * Schema is now owned by Prisma migrations — run `prisma migrate deploy`
 * (or `prisma migrate dev`) against the target database before starting
 * the server. This only ensures the connection is established.
 */
export async function initDB() {
  await prisma.$connect();
}

export default pool;
export { prisma, pool };
