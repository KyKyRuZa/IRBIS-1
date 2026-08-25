import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import styles from '@styles/ErrorState.module.css';

export default function ErrorState({ title = 'Произошла ошибка', message, onRetry, retryLabel = 'Повторить' }) {
  return (
    <div className={styles.wrapper} role="alert">
      <div className={styles.icon}>
        <FontAwesomeIcon icon={faTriangleExclamation} />
      </div>
      <h3 className={styles.title}>{title}</h3>
      {message && <p className={styles.message}>{message}</p>}
      {onRetry && (
        <button type="button" className="btn" onClick={onRetry}>
          {retryLabel}
        </button>
      )}
    </div>
  );
}
