import Icon from '@components/ui/Icon.jsx';
import styles from '@styles/ErrorState.module.css';

export default function ErrorState({ title = 'Произошла ошибка', message, onRetry, retryLabel = 'Повторить' }) {
  return (
    <div className={styles.wrapper} role="alert">
      <div className={styles.icon}>
        <Icon name="alertTriangle" size={32} />
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
