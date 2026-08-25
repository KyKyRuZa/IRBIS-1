import { Link } from 'react-router-dom';
import styles from '@/styles/NotFoundPage.module.css';

export default function NotFoundPage() {
  return (
    <div className={styles.pageWrapper}>
      <div className={styles.content}>
        <div className={styles.code}>404</div>
        <h1 className={styles.title}>Страница не найдена</h1>
        <p className={styles.description}>
          Запрошенная страница не существует или была перемещена.
        </p>
        <Link to="/" className="btn">
          На главную
        </Link>
      </div>
    </div>
  );
}
