import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBoxOpen } from '@fortawesome/free-solid-svg-icons';
import styles from '@styles/EmptyState.module.css';

export default function EmptyState({ icon, title, description, action }) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.icon}>
        {icon || <FontAwesomeIcon icon={faBoxOpen} />}
      </div>
      <h3 className={styles.title}>{title}</h3>
      {description && <p className={styles.description}>{description}</p>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
