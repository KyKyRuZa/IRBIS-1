import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { employeesService } from '@/lib/services/employees.service.js';
import { certificatesService } from '@/lib/services/certificates.service.js';
import { issuesService } from '@/lib/services/issues.service.js';
import { adminService } from '@/lib/services/admin.service.js';
import { useAuth } from '@/hooks/useAuth.js';
import { normalizeEmployeeStatus, EMPLOYEE_STATUS_VALUES } from '@/lib/constants/employee-statuses.js';
import { CERTIFICATE_STATUSES } from '@/lib/constants/certificate-statuses.js';
import { formatDate } from '@/lib/utils/date.js';
import LoadingState from '@/components/ui/LoadingState.jsx';
import ErrorState from '@/components/ui/ErrorState.jsx';
import EmptyState from '@/components/ui/EmptyState.jsx';
import styles from '@styles/Dashboard.module.css';

function settle(value, fallback) {
  return value.status === 'fulfilled' ? value.value : fallback;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [employees, certificates, expiring, demand, notifications, issues] = await Promise.allSettled([
          employeesService.list(),
          certificatesService.list(),
          issuesService.getExpiring(2),
          adminService.getDemand(),
          adminService.getNotifications(),
          issuesService.list(),
        ]);

        if (!mounted) return;

        const empList = Array.isArray(settle(employees, [])) ? settle(employees, []) : [];
        const certList = Array.isArray(settle(certificates, [])) ? settle(certificates, []) : [];
        const expList = Array.isArray(settle(expiring, [])) ? settle(expiring, []) : [];
        const demList = Array.isArray(settle(demand, [])) ? settle(demand, []) : [];
        const notifList = Array.isArray(settle(notifications, [])) ? settle(notifications, []) : [];
        const issList = Array.isArray(settle(issues, [])) ? settle(issues, []) : [];

        const activeEmployees = empList.filter(
          (e) => normalizeEmployeeStatus(e.status) === EMPLOYEE_STATUS_VALUES.active
        ).length;
        const expiredCerts = certList.filter((c) => c.status === CERTIFICATE_STATUSES.expired);
        const expiringCerts = certList.filter((c) => c.status === CERTIFICATE_STATUSES.expiring);
        const demandItems = demList.filter((d) => d.demand_qty > 0);
        const issuedCount = issList.filter((r) => r.status === 'issued').length;
        const unread = notifList.filter((n) => !n.read);

        setData({
          totalEmployees: empList.length,
          activeEmployees,
          expiredCerts,
          expiringCerts,
          expiringSiz: expList,
          demandItems,
          issuedCount,
          notifications: unread,
        });
      } catch (e) {
        if (mounted) setError(e.message || 'Ошибка загрузки рабочего стола');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <LoadingState label="Загрузка рабочего стола..." />;
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;

  const d = data || {};
  const attentionCount =
    (d.expiredCerts?.length || 0) +
    (d.expiringSiz?.length || 0) +
    (d.demandItems?.length || 0) +
    (d.notifications?.length || 0);

  const today = new Date().toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.pageHeader}>
        <div className={`${styles.container} ${styles.pageHeaderContent}`}>
          <div className={styles.title}>
            <h1>Рабочий стол</h1>
            <div className={styles.subtitle}>
              {today}
              {user?.username ? ` · ${user.username}` : ''}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.container}>
        {/* Быстрые действия — самое частое, что делает офис */}
        <div className={styles.quickActions}>
          <Link to="/issue" className={`${styles.quickBtn} ${styles.quickPrimary}`}>
            + Новая выдача
          </Link>
          <Link to="/employees" className={styles.quickBtn}>
            + Сотрудник
          </Link>
          <Link to="/certificates" className={styles.quickBtn}>
            Сертификат
          </Link>
          <Link to="/reports" className={styles.quickBtn}>
            Отчёт
          </Link>
        </div>

        {/* KPI — что происходит в цифрах */}
        <div className={styles.kpiGrid}>
          <div className={`${styles.kpiCard} ${styles.kpiPrimary}`}>
            <div className={styles.kpiValue}>{d.totalEmployees || 0}</div>
            <div className={styles.kpiLabel}>Сотрудников (активных: {d.activeEmployees || 0})</div>
          </div>
          <div className={`${styles.kpiCard} ${styles.kpiInfo}`}>
            <div className={styles.kpiValue}>{d.issuedCount || 0}</div>
            <div className={styles.kpiLabel}>Выдано сейчас</div>
          </div>
          <div className={`${styles.kpiCard} ${styles.kpiDanger}`}>
            <div className={styles.kpiValue}>{d.expiredCerts?.length || 0}</div>
            <div className={styles.kpiLabel}>Сертификатов просрочено</div>
          </div>
          <div className={`${styles.kpiCard} ${styles.kpiWarning}`}>
            <div className={styles.kpiValue}>
              {(d.expiringSiz?.length || 0) + (d.demandItems?.length || 0)}
            </div>
            <div className={styles.kpiLabel}>СИЗ требует внимания</div>
          </div>
        </div>

        {attentionCount === 0 ? (
          <div className="card">
            <EmptyState
              title="Всё в порядке"
              description="Просроченных сертификатов и истекающих СИЗ нет. Можно заняться плановой выдачей."
            />
          </div>
        ) : (
          <div className={styles.widgetsGrid}>
            {/* Уведомления (уже агрегированы бэкендом) */}
            <div className="card">
              <div className={styles.widgetHeader}>
                <h3>Нужно сделать</h3>
                <span className={styles.widgetCount}>{d.notifications?.length || 0}</span>
              </div>
              {!d.notifications?.length ? (
                <p className={styles.empty}>Нет новых уведомлений</p>
              ) : (
                <ul className={styles.taskList}>
                  {d.notifications.slice(0, 6).map((n) => (
                    <li
                      key={n.id}
                      className={`${styles.taskItem} ${
                        n.severity === 'danger'
                          ? styles.sevDanger
                          : n.severity === 'warning'
                          ? styles.sevWarning
                          : styles.sevInfo
                      }`}
                    >
                      <span className={styles.taskTitle}>{n.message}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Просроченные / истекающие сертификаты */}
            <div className="card">
              <div className={styles.widgetHeader}>
                <h3>Сертификаты</h3>
                <Link to="/certificates" className={styles.widgetLink}>
                  Все →
                </Link>
              </div>
              {!d.expiredCerts?.length && !d.expiringCerts?.length ? (
                <p className={styles.empty}>Все сертификаты действительны</p>
              ) : (
                <ul className={styles.taskList}>
                  {[...d.expiredCerts, ...d.expiringCerts].slice(0, 6).map((c) => (
                    <li
                      key={c.id}
                      className={`${styles.taskItem} ${
                        c.status === CERTIFICATE_STATUSES.expired ? styles.sevDanger : styles.sevWarning
                      }`}
                    >
                      <span className={styles.taskTitle}>{c.product_name}</span>
                      <span className={styles.taskMeta}>
                        {c.certificate_number || '—'} · до {formatDate(c.expiry_date)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Истекающие СИЗ (2 мес) */}
            <div className="card">
              <div className={styles.widgetHeader}>
                <h3>СИЗ с истекающим сроком (2 мес)</h3>
                <Link to="/issue" className={styles.widgetLink}>
                  Выдача →
                </Link>
              </div>
              {!d.expiringSiz?.length ? (
                <p className={styles.empty}>В ближайшие 2 месяца сроки не истекают</p>
              ) : (
                <ul className={styles.taskList}>
                  {d.expiringSiz.slice(0, 6).map((r) => (
                    <li key={r.id} className={`${styles.taskItem} ${styles.sevWarning}`}>
                      <span className={styles.taskTitle}>
                        {r.full_name} — {r.item_type_name}
                      </span>
                      <span className={styles.taskMeta}>до {formatDate(r.expiry_date)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Потребность — кому не хватает нормы */}
            <div className="card">
              <div className={styles.widgetHeader}>
                <h3>Потребность в СИЗ</h3>
                <Link to="/reports" className={styles.widgetLink}>
                  Отчёт →
                </Link>
              </div>
              {!d.demandItems?.length ? (
                <p className={styles.empty}>По всем позициям норма закрыта</p>
              ) : (
                <ul className={styles.taskList}>
                  {d.demandItems.slice(0, 6).map((item) => (
                    <li key={item.item_type_id} className={`${styles.taskItem} ${styles.sevInfo}`}>
                      <span className={styles.taskTitle}>
                        {item.item_name} — нужно выдать {item.demand_qty} шт.
                      </span>
                      <span className={styles.taskMeta}>
                        в использовании: {item.in_use_qty} / норма: {item.norm_qty}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
