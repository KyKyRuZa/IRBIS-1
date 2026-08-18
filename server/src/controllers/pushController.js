import pool from '../models/db.js';
import webpush from 'web-push';

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  throw new Error('VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY must be set in environment variables');
}

webpush.setVapidDetails(
  'mailto:admin@irbis.local',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

export async function subscribePush(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { endpoint, keys, employee_id } = req.body;
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ error: 'endpoint, keys.p256dh and keys.auth are required' });
    }
    let effectiveEmployeeId = employee_id;
    if (effectiveEmployeeId === undefined || effectiveEmployeeId === null || effectiveEmployeeId === '') {
      const empResult = await pool.query('SELECT id FROM employees WHERE id = $1', [userId]);
      if (empResult.rows.length > 0) {
        effectiveEmployeeId = userId;
      } else {
        effectiveEmployeeId = null;
      }
    } else {
      const empResult = await pool.query('SELECT id FROM employees WHERE id = $1', [effectiveEmployeeId]);
      if (empResult.rows.length === 0) {
        return res.status(400).json({ error: 'Employee not found' });
      }
    }
    const userAgent = req.headers['user-agent'] || undefined;
    await pool.query(`
      INSERT INTO push_subscriptions (employee_id, endpoint, p256dh, auth, user_agent)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (employee_id, endpoint) DO UPDATE SET
        p256dh = EXCLUDED.p256dh,
        auth = EXCLUDED.auth,
        user_agent = EXCLUDED.user_agent
    `, [effectiveEmployeeId, endpoint, keys.p256dh, keys.auth, userAgent]);
    res.status(201).json({ message: 'Subscription saved', employee_id: effectiveEmployeeId });
  } catch (error) {
    next(error);
  }
}

export async function unsubscribePush(req, res, next) {
  try {
    const employeeId = req.user?.id;
    if (!employeeId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { endpoint } = req.body;
    if (!endpoint) {
      return res.status(400).json({ error: 'endpoint is required' });
    }
    await pool.query('DELETE FROM push_subscriptions WHERE employee_id = $1 AND endpoint = $2', [employeeId, endpoint]);
    res.json({ message: 'Subscription removed' });
  } catch (error) {
    next(error);
  }
}

export async function sendPushToEmployee(req, res, next) {
  try {
    const { employeeId, notificationId } = req.body;
    let query = 'SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE 1=1';
    const params = [];
    if (employeeId) {
      query += ` AND employee_id = $${params.length + 1}`;
      params.push(employeeId);
    }
    if (notificationId) {
      query += ` AND employee_id = (SELECT employee_id FROM notifications WHERE notification_id = $${params.length + 1})`;
      params.push(notificationId);
    }
    const result = await pool.query(query, params);
    const subscriptions = result.rows;
    if (subscriptions.length === 0) {
      return res.status(404).json({ error: 'No subscriptions found' });
    }
    const payload = notificationId
      ? JSON.stringify({ notificationId })
      : JSON.stringify({ title: 'Тестовое уведомление', body: 'Это тестовое push-уведомление от IRBIS' });
    const promises = subscriptions.map(sub => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth }
      };
      console.log('Sending push to', sub.endpoint, 'payload', payload);
      return webpush.sendNotification(pushSubscription, payload).catch(async err => {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await pool.query('DELETE FROM push_subscriptions WHERE id = $1', [sub.id]);
        }
        console.error('Push send error', err.statusCode, err.body);
        return null;
      });
    });
    await Promise.all(promises);
    const remaining = await pool.query('SELECT COUNT(*) FROM push_subscriptions WHERE employee_id = $1', [employeeId]);
    res.json({ message: `Sent attempt finished. Remaining subscriptions for employee: ${remaining.rows[0].count}` });
  } catch (error) {
    next(error);
  }
}

export async function sendPushToAll(req, res, next) {
  try {
    const result = await pool.query('SELECT id, endpoint, p256dh, auth FROM push_subscriptions');
    const subscriptions = result.rows;
    if (subscriptions.length === 0) {
      return res.status(404).json({ error: 'No subscriptions found' });
    }
    const payload = JSON.stringify({ title: 'Тестовое уведомление', body: 'Это тестовое push-уведомление для всех сотрудников от IRBIS' });
    const promises = subscriptions.map(sub => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth }
      };
      console.log('Sending push to', sub.endpoint, 'payload', payload);
      return webpush.sendNotification(pushSubscription, payload).catch(async err => {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await pool.query('DELETE FROM push_subscriptions WHERE id = $1', [sub.id]);
        }
        console.error('Push send error', err.statusCode, err.body);
        return null;
      });
    });
    await Promise.all(promises);
    const remaining = await pool.query('SELECT COUNT(*) FROM push_subscriptions');
    res.json({ message: `Sent attempt finished. Remaining subscriptions: ${remaining.rows[0].count}` });
  } catch (error) {
    next(error);
  }
}

export function getVapidPublicKey(req, res) {
  res.json({ publicKey: VAPID_PUBLIC_KEY });
}
