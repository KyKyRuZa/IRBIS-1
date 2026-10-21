import pool from '../models/db.js'
import { logger } from '../utils/logger.js'

export async function getDemandReport(req, res, next) {
  try {
    const { site_id } = req.query
    const siteParam = site_id ? [site_id] : []

    const activeEmployeesRes = await pool.query(
      `SELECT COUNT(*)::int as active_employees
       FROM employees e
       WHERE e.status = 'active' ${site_id ? 'AND e.site_id = $1' : ''}`,
      siteParam
    )
    const activeEmployees = activeEmployeesRes.rows[0]?.active_employees || 0

    const result = await pool.query(
      `
      SELECT 
        it.id as item_type_id,
        it.name as item_name,
        it.category,
        it.unit,
        COALESCE(SUM(ir.quantity), 0) as issued_qty,
        COALESCE(SUM(ir.return_quantity), 0) as returned_qty,
        COALESCE(SUM(ir.quantity) - SUM(ir.return_quantity), 0) as in_use_qty
      FROM item_types it
      LEFT JOIN issue_records ir ON ir.item_type_id = it.id
        AND ir.status NOT IN ('returned', 'disposed')
        ${site_id ? "AND EXISTS (SELECT 1 FROM employees e WHERE e.id = ir.employee_id AND e.status = 'active' AND e.site_id = $1)" : ''}
      GROUP BY it.id, it.name, it.category, it.unit
      ORDER BY it.category, it.name
    `,
      siteParam
    )
    const rows = result.rows

    const norms = await pool.query(
      `
      SELECT in_.item_type_id, COUNT(DISTINCT e.id) as covered_employees, SUM(in_.quantity) as norm_qty
      FROM issue_norms in_
      JOIN employees e ON (e.gender = in_.gender OR in_.gender IS NULL)
      WHERE e.status = 'active'
      ${site_id ? 'AND e.site_id = $1' : ''}
      GROUP BY in_.item_type_id
    `,
      siteParam
    )

    const normMap = {}
    norms.rows.forEach((n) => {
      normMap[n.item_type_id] = n
    })

    const demand = rows.map((r) => {
      const norm = normMap[r.item_type_id]
      const normQty = norm ? Number(norm.norm_qty) : 0
      const needed = normQty - Number(r.in_use_qty)
      return {
        item_type_id: r.item_type_id,
        item_name: r.item_name,
        category: r.category,
        unit: r.unit,
        active_employees: activeEmployees,
        in_use_qty: Number(r.in_use_qty),
        norm_qty: normQty,
        demand_qty: needed > 0 ? needed : 0,
        covered_employees: norm ? Number(norm.covered_employees) : 0,
      }
    })

    res.json(demand.filter((d) => d.demand_qty > 0))
  } catch (error) {
    next(error)
  }
}

export async function getNotifications(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const limitNum = Math.min(200, Math.max(1, parseInt(req.query.limit) || 50))
    const offset = (page - 1) * limitNum

    const [result, countResult] = await Promise.all([
      pool.query(
        `
        SELECT notification_id as id, type, severity, message, employee_id, site_id, date, read
        FROM notifications
        ORDER BY date DESC
        LIMIT $1 OFFSET $2
      `,
        [limitNum, offset]
      ),
      pool.query('SELECT COUNT(*) FROM notifications'),
    ])

    const total = Number(countResult.rows[0].count)
    res.set('X-Pagination', JSON.stringify({ page, limit: limitNum, total }))
    res.json({ data: result.rows, pagination: { page, limit: limitNum, total } })
  } catch (error) {
    next(error)
  }
}

export async function markNotificationRead(req, res, next) {
  try {
    const { id } = req.params
    await pool.query(`UPDATE notifications SET read = true WHERE notification_id = $1`, [id])
    res.json({ success: true })
  } catch (error) {
    next(error)
  }
}

export async function markAllNotificationsRead(req, res, next) {
  try {
    await pool.query(`UPDATE notifications SET read = true WHERE read = false`)
    res.json({ success: true })
  } catch (error) {
    next(error)
  }
}

export async function backupDatabase(req, res, next) {
  try {
    const { spawn } = await import('child_process')

    const dbHost = process.env.DB_HOST || 'localhost'
    const dbPort = process.env.DB_PORT || 5432
    const dbName = process.env.DB_NAME || 'irbis'
    const dbUser = process.env.DB_USER || 'postgres'
    const dbPassword = process.env.DB_PASSWORD || 'postgres'

    const date = new Date().toISOString().split('T')[0]
    const args = ['-h', dbHost, '-p', String(dbPort), '-U', dbUser, '-d', dbName]

    res.setHeader('Content-Type', 'application/sql')
    res.setHeader('Content-Disposition', `attachment; filename="irbis_backup_${date}.sql"`)

    const pgdump = spawn('pg_dump', args, {
      env: { PGPASSWORD: dbPassword, PGSSLMODE: 'disable' },
    })

    pgdump.stdout.pipe(res)

    pgdump.on('close', (code) => {
      if (code !== 0) {
        logger.error({ code }, 'pg_dump exited with non-zero code')
      }
    })

    pgdump.on('error', (err) => {
      logger.error(err, 'Failed to start pg_dump')
      if (!res.headersSent) {
        res.status(500).json({ error: 'Backup failed' })
      }
    })
  } catch (error) {
    next(error)
  }
}
