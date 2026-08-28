import pool from '../models/db.js';

export async function getDemandReport(req, res, next) {
  try {
    const { site_id } = req.query;
    let query = `
      SELECT 
        it.id as item_type_id,
        it.name as item_name,
        it.category,
        it.unit,
        COUNT(DISTINCT e.id) FILTER (WHERE e.status = 'active') as active_employees,
        COALESCE(SUM(ir.quantity), 0) as issued_qty,
        COALESCE(SUM(ir.return_quantity), 0) as returned_qty,
        COALESCE(SUM(ir.quantity) - SUM(ir.return_quantity), 0) as in_use_qty
      FROM item_types it
      CROSS JOIN employees e
      LEFT JOIN issue_norms in_ ON in_.item_type_id = it.id
      LEFT JOIN issue_records ir ON ir.item_type_id = it.id AND ir.employee_id = e.id AND ir.status NOT IN ('returned', 'disposed')
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (site_id) {
      query += ` AND e.site_id = $${paramIndex++}`;
      params.push(site_id);
    }

    query += ` GROUP BY it.id, it.name, it.category, it.unit ORDER BY it.category, it.name`;
    const result = await pool.query(query, params);
    const rows = result.rows;

    const norms = await pool.query(`
      SELECT in_.item_type_id, COUNT(DISTINCT e.id) as covered_employees, SUM(in_.quantity) as norm_qty
      FROM issue_norms in_
      JOIN employees e ON (e.gender = in_.gender OR in_.gender IS NULL)
      WHERE e.status = 'active'
      ${site_id ? `AND e.site_id = $${paramIndex++}` : ''}
      GROUP BY in_.item_type_id
    `, site_id ? [...params, site_id] : params);

    const normMap = {};
    norms.rows.forEach(n => {
      normMap[n.item_type_id] = n;
    });

    const demand = rows.map(r => {
      const norm = normMap[r.item_type_id];
      const normQty = norm ? Number(norm.norm_qty) : 0;
      const needed = normQty - Number(r.in_use_qty);
      return {
        item_type_id: r.item_type_id,
        item_name: r.item_name,
        category: r.category,
        unit: r.unit,
        active_employees: Number(r.active_employees),
        in_use_qty: Number(r.in_use_qty),
        norm_qty: normQty,
        demand_qty: needed > 0 ? needed : 0,
        covered_employees: norm ? Number(norm.covered_employees) : 0
      };
    });

    res.json(demand.filter(d => d.demand_qty > 0));
  } catch (error) {
    next(error);
  }
}

export async function getNotifications(req, res, next) {
  try {
    const result = await pool.query(`
      SELECT notification_id as id, type, severity, message, employee_id, site_id, date, read
      FROM notifications
      ORDER BY date DESC
    `);
    const notifications = result.rows.map(row => ({
      id: row.id,
      type: row.type,
      severity: row.severity,
      message: row.message,
      employee_id: row.employee_id,
      site_id: row.site_id,
      date: row.date,
      read: row.read
    }));
    res.json(notifications);
  } catch (error) {
    next(error);
  }
}

export async function markNotificationRead(req, res, next) {
  try {
    const { id } = req.params;
    await pool.query(
      `UPDATE notifications SET read = true WHERE notification_id = $1`,
      [id]
    );
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

export async function markAllNotificationsRead(req, res, next) {
  try {
    await pool.query(`UPDATE notifications SET read = true WHERE read = false`);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

export async function backupDatabase(req, res, next) {
  try {
    const { execFile } = await import('child_process');
    const { unlink } = await import('fs/promises');
    const { promisify } = await import('util');
    const execFileAsync = promisify(execFile);

    const dbHost = process.env.DB_HOST || 'localhost';
    const dbPort = process.env.DB_PORT || 5432;
    const dbName = process.env.DB_NAME || 'irbis';
    const dbUser = process.env.DB_USER || 'postgres';
    const dbPassword = process.env.DB_PASSWORD || 'postgres';

    const date = new Date().toISOString().split('T')[0];
    const dumpPath = `/tmp/irbis_backup_${date}.sql`;
    const args = ['-h', dbHost, '-p', String(dbPort), '-U', dbUser, '-d', dbName, '-f', dumpPath];

    await execFileAsync('pg_dump', args, { env: { ...process.env, PGPASSWORD: dbPassword } });

    res.download(dumpPath, `irbis_backup_${date}.sql`, (err) => {
      unlink(dumpPath).catch(() => {});
      if (err) {
        console.error('Backup download error:', err);
      }
    });
  } catch (error) {
    next(error);
  }
}
