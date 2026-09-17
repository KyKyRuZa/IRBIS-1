import Icon from '@components/ui/Icon.jsx';
import styles from '@styles/EmptyState.module.css';

export default function EmptyState({ icon, title, description, action }) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.icon}>
        {icon || <Icon name="packageOpen" size={48} />}
      </div>
      <h3 className={styles.title}>{title}</h3>
      {description && <p className={styles.description}>{description}</p>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
