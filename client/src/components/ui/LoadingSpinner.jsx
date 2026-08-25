import styles from '@styles/LoadingSpinner.module.css';

export default function LoadingSpinner({ size = 40 }) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.spinner} style={{ width: size, height: size }} />
    </div>
  );
}
