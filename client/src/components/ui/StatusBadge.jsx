import Icon from '@components/ui/Icon.jsx';
import styles from '@styles/StatusBadge.module.css';

const STATUS_STYLES = {
  active: { className: 'success', label: 'Активен', icon: 'checkCircle2' },
  expiring: { className: 'warning', label: 'Истекает', icon: 'clock' },
  expired: { className: 'danger', label: 'Просрочен', icon: 'xCircle' },
  issued: { className: 'success', label: 'Выдано', icon: 'checkCircle2' },
  disposed: { className: 'danger', label: 'Списано', icon: 'trash' },
  returned: { className: 'info', label: 'Возвращено', icon: 'rotateCcw' },
  due_for_disposal: { className: 'warning', label: 'Подлежит списанию', icon: 'alertTriangle' },
};

export default function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || { className: '', label: status };
  if (!status) return null;
  return (
    <span className={`${styles.badge} ${styles[style.className]}`}>
      {style.label}
    </span>
  );
}
