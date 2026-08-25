const STATUS_STYLES = {
  active: { className: 'success', label: 'Активен' },
  expiring: { className: 'warning', label: 'Истекает' },
  expired: { className: 'danger', label: 'Просрочен' },
  issued: { className: 'success', label: 'Выдано' },
  disposed: { className: 'danger', label: 'Списано' },
  returned: { className: 'info', label: 'Возвращено' },
  due_for_disposal: { className: 'warning', label: 'Подлежит списанию' },
};

import styles from '@styles/StatusBadge.module.css';

export default function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || { className: '', label: status };
  if (!status) return null;
  return <span className={`${styles.badge} ${styles[style.className]}`}>{style.label}</span>;
}
