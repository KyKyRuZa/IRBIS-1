import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '@/lib/services/admin.service.js';
import LoadingState from '@components/ui/LoadingState.jsx';
import ErrorState from '@components/ui/ErrorState.jsx';
import EmptyState from '@components/ui/EmptyState.jsx';
import styles from '@styles/Notifications.module.css';

const SEVERITY_STYLES = {
  warning: styles.severityWarning,
  danger: styles.severityDanger,
  info: styles.severityInfo,
};

function NotificationsPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.getNotifications();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || 'Не удалось загрузить уведомления');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const unreadCount = useMemo(() => items.filter(n => !n.read).length, [items]);

  const handleMarkRead = async (id) => {
    try {
      await adminService.markNotificationRead(id);
      setItems(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
      window.dispatchEvent(new Event('notifications:updated'));
    } catch {
      // ignore
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await adminService.markAllNotificationsRead();
      setItems(prev => prev.map(n => ({ ...n, read: true })));
      window.dispatchEvent(new Event('notifications:updated'));
    } catch {
      // ignore
    }
  };

  const getNotificationLink = (n) => {
    if (n.type === 'expiring_item' || n.type === 'expired_item' || n.type === 'reorder') {
      const params = new URLSearchParams();
      if (n.employee_id) params.set('employee_id', String(n.employee_id));
      if (n.type === 'expired_item' || n.type === 'reorder') params.set('status', 'issued');
      const qs = params.toString();
      return `/issue${qs ? `?${qs}` : ''}`;
    }
    if (n.type === 'expiring_certificate' || n.type === 'expired_certificate') {
      return '/certificates';
    }
    return null;
  };

  const handleNotificationClick = (n) => {
    const link = getNotificationLink(n);
    if (link) {
      navigate(link);
    }
    handleMarkRead(n.id);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Уведомления</h1>
          <p className={styles.subtitle}>
            {unreadCount > 0 ? `Непрочитанных: ${unreadCount}` : 'Все уведомления прочитаны'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button type="button" className="btn" onClick={handleMarkAllRead}>
            Прочитать все
          </button>
        )}
      </div>

      <div className={styles.card}>
        {loading ? (
          <LoadingState label="Загрузка уведомлений..." />
        ) : error ? (
          <ErrorState title="Ошибка загрузки" message={error} onRetry={load} />
        ) : items.length === 0 ? (
          <EmptyState title="Нет уведомлений" description="Новые уведомления появятся здесь автоматически." />
        ) : (
          <div className={styles.list}>
            {items.map(n => (
              <div
                key={n.id}
                className={`${styles.item} ${!n.read ? styles.itemUnread : ''}`}
                onClick={() => handleNotificationClick(n)}
              >
                <div className={styles.itemHeader}>
                  <span className={`${styles.severityBadge} ${SEVERITY_STYLES[n.severity] || ''}`}>
                    {n.severity}
                  </span>
                  <span className={styles.itemDate}>
                    {n.date ? new Date(n.date).toLocaleDateString('ru-RU') : ''}
                  </span>
                </div>
                <div className={styles.itemMessage}>{n.message}</div>
                <div className={styles.itemActions}>
                  {getNotificationLink(n) && (
                    <span className={styles.itemAction}>Перейти →</span>
                  )}
                  {!n.read && <span className={styles.unreadDot} />}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default NotificationsPage;
