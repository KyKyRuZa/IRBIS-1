import LoadingSpinner from './LoadingSpinner.jsx';
import styles from './LoadingState.module.css';

export default function LoadingState({ label = 'Загрузка...', size = 40 }) {
  return (
    <div className={styles.wrapper}>
      <LoadingSpinner size={size} />
      {label && <p className={styles.label}>{label}</p>}
    </div>
  );
}
