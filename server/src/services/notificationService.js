import pool from '../models/db.js';

export async function aggregateNotifications() {
  await pool.query('DELETE FROM notifications');

  const notifications = [];

  const expiringItems = await pool.query(`
    SELECT r.id, e.id as employee_id, e.full_name, e.site_id, s.name as site_name, it.name as item_name, r.expiry_date
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
      notification_id: `item_${r.id}`,
      type: 'expiring_item',
      severity: 'warning',
      message: `Срок носки "${r.item_name}" у ${r.full_name} истекает ${new Date(r.expiry_date).toLocaleDateString('ru-RU')}`,
      employee_id: r.employee_id,
      site_id: r.site_id,
      date: r.expiry_date
    });
  });

  const expiredItems = await pool.query(`
    SELECT r.id, e.id as employee_id, e.full_name, it.name as item_name, r.expiry_date
    FROM issue_records r
    JOIN employees e ON r.employee_id = e.id
    JOIN item_types it ON r.item_type_id = it.id
    WHERE r.expiry_date < NOW()
      AND r.status = 'issued'
  `);
  expiredItems.rows.forEach(r => {
    notifications.push({
      notification_id: `expired_${r.id}`,
      type: 'expired_item',
      severity: 'danger',
      message: `Срок носки "${r.item_name}" у ${r.full_name} просрочен! Следует списать и выдать новую.`,
      employee_id: r.employee_id,
      date: r.expiry_date
    });
  });

  const expiringCerts = await pool.query(`
    SELECT c.id, it.name as item_name, c.certificate_number, c.expiry_date
    FROM certificates c
    JOIN item_types it ON c.item_type_id = it.id
    WHERE c.expiry_date <= NOW() + make_interval(months => 1)
      AND c.status != 'expired'
  `);
  expiringCerts.rows.forEach(c => {
    notifications.push({
      notification_id: `cert_${c.id}`,
      type: 'expiring_certificate',
      severity: 'warning',
      message: `Сертификат на "${c.item_name}" №${c.certificate_number} истекает ${new Date(c.expiry_date).toLocaleDateString('ru-RU')}`,
      date: c.expiry_date
    });
  });

  const expiredCerts = await pool.query(`
    SELECT c.id, it.name as item_name, c.certificate_number, c.expiry_date
    FROM certificates c
    JOIN item_types it ON c.item_type_id = it.id
    WHERE c.expiry_date < NOW()
      AND c.status != 'expired'
  `);
  expiredCerts.rows.forEach(c => {
    notifications.push({
      notification_id: `expired_cert_${c.id}`,
      type: 'expired_certificate',
      severity: 'danger',
      message: `Сертификат на "${c.item_name}" №${c.certificate_number} просрочен!`,
      date: c.expiry_date
    });
  });

  const reorderItems = await pool.query(`
    SELECT r.id, e.id as employee_id, e.full_name, it.name as item_name, r.reorder_date
    FROM issue_records r
    JOIN employees e ON r.employee_id = e.id
    JOIN item_types it ON r.item_type_id = it.id
    WHERE r.reorder_date <= NOW()
      AND r.status = 'issued'
  `);
  reorderItems.rows.forEach(r => {
    notifications.push({
      notification_id: `reorder_${r.id}`,
      type: 'reorder',
      severity: 'info',
      message: `По "${r.item_name}" у ${r.full_name} пора заказывать новую партию (с ${new Date(r.reorder_date).toLocaleDateString('ru-RU')})`,
      employee_id: r.employee_id,
      date: r.reorder_date
    });
  });

  for (const n of notifications) {
    await pool.query(`
      INSERT INTO notifications (notification_id, type, severity, message, employee_id, site_id, date, read, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, false, NOW())
      ON CONFLICT (notification_id) DO UPDATE SET
        type = EXCLUDED.type,
        severity = EXCLUDED.severity,
        message = EXCLUDED.message,
        employee_id = EXCLUDED.employee_id,
        site_id = EXCLUDED.site_id,
        date = EXCLUDED.date,
        created_at = NOW()
    `, [
      n.notification_id,
      n.type,
      n.severity,
      n.message,
      n.employee_id || null,
      n.site_id || null,
      n.date
    ]);
  }
}
