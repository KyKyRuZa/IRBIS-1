import pool from '../models/db.js';

export async function getDemandReport(req, res) {
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
    res.status(500).json({ error: error.message });
  }
}

export async function getNotifications(req, res) {
  try {
    const notifications = [];

    const expiringItems = await pool.query(`
      SELECT r.*, e.full_name, e.position, e.site_id, s.name as site_name, it.name as item_name
      FROM issue_records r
      JOIN employees e ON r.employee_id = e.id
      JOIN item_types it ON r.item_type_id = it.id
      LEFT JOIN sites s ON e.site_id = s.id
      WHERE r.expiry_date <= NOW() + make_interval(months => 1)
        AND r.status = 'issued'
      ORDER BY r.expiry_date ASC
    `);
    expiringItems.rows.forEach(r => {
      notifications.push({
        id: `item_${r.id}`,
        type: 'expiring_item',
        severity: 'warning',
        message: `Срок носки "${r.item_name}" у ${r.full_name} истекает ${new Date(r.expiry_date).toLocaleDateString('ru-RU')}`,
        employee_id: r.employee_id,
        site_id: r.site_id,
        date: r.expiry_date
      });
    });

    const expiredItems = await pool.query(`
      SELECT r.*, e.full_name, e.position, it.name as item_name
      FROM issue_records r
      JOIN employees e ON r.employee_id = e.id
      JOIN item_types it ON r.item_type_id = it.id
      WHERE r.expiry_date < NOW()
        AND r.status = 'issued'
    `);
    expiredItems.rows.forEach(r => {
      notifications.push({
        id: `expired_${r.id}`,
        type: 'expired_item',
        severity: 'danger',
        message: `Срок носки "${r.item_name}" у ${r.full_name} просрочен! Следует списать и выдать новую.`,
        employee_id: r.employee_id,
        date: r.expiry_date
      });
    });

    const expiringCerts = await pool.query(`
      SELECT c.*, it.name as item_name
      FROM certificates c
      JOIN item_types it ON c.item_type_id = it.id
      WHERE c.expiry_date <= NOW() + make_interval(months => 1)
        AND c.status != 'expired'
    `);
    expiringCerts.rows.forEach(c => {
      notifications.push({
        id: `cert_${c.id}`,
        type: 'expiring_certificate',
        severity: 'warning',
        message: `Сертификат на "${c.item_name}" №${c.certificate_number} истекает ${new Date(c.expiry_date).toLocaleDateString('ru-RU')}`,
        date: c.expiry_date
      });
    });

    const expiredCerts = await pool.query(`
      SELECT c.*, it.name as item_name
      FROM certificates c
      JOIN item_types it ON c.item_type_id = it.id
      WHERE c.expiry_date < NOW()
        AND c.status != 'expired'
    `);
    expiredCerts.rows.forEach(c => {
      notifications.push({
        id: `expired_cert_${c.id}`,
        type: 'expired_certificate',
        severity: 'danger',
        message: `Сертификат на "${c.item_name}" №${c.certificate_number} просрочен!`,
        date: c.expiry_date
      });
    });

    const reorderItems = await pool.query(`
      SELECT r.*, e.full_name, it.name as item_name
      FROM issue_records r
      JOIN employees e ON r.employee_id = e.id
      JOIN item_types it ON r.item_type_id = it.id
      WHERE r.reorder_date <= NOW()
        AND r.status = 'issued'
    `);
    reorderItems.rows.forEach(r => {
      notifications.push({
        id: `reorder_${r.id}`,
        type: 'reorder',
        severity: 'info',
        message: `По "${r.item_name}" у ${r.full_name} пора заказывать новую партию (с ${new Date(r.reorder_date).toLocaleDateString('ru-RU')})`,
        employee_id: r.employee_id,
        date: r.reorder_date
      });
    });

    notifications.sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function backupDatabase(req, res) {
  try {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    const dbHost = process.env.DB_HOST || 'localhost';
    const dbPort = process.env.DB_PORT || 5432;
    const dbName = process.env.DB_NAME || 'irbis';
    const dbUser = process.env.DB_USER || 'postgres';
    const dbPassword = process.env.DB_PASSWORD || 'postgres';

    const dumpPath = `/tmp/irbis_backup_${new Date().toISOString().split('T')[0]}.sql`;
    const command = `PGPASSWORD="${dbPassword}" pg_dump -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -f ${dumpPath}`;

    await execAsync(command);

    res.download(dumpPath, `irbis_backup_${new Date().toISOString().split('T')[0]}.sql`, (err) => {
      if (err) {
        console.error('Backup download error:', err);
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
