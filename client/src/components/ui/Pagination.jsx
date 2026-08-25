import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import styles from '@styles/Pagination.module.css';

export default function Pagination({ totalItems, itemsPerPage = 10, currentPage, onPageChange }) {
  if (totalItems <= itemsPerPage) return null;

  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const maxVisible = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);
  if (endPage - startPage + 1 < maxVisible) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  const pages = [];
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div className={styles.pagination}>
      <button
        className={styles.button}
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        aria-label="Назад"
      >
        <FontAwesomeIcon icon={faChevronLeft} />
      </button>
      {startPage > 1 && (
        <>
          <button className={styles.button} onClick={() => onPageChange(1)}>1</button>
          {startPage > 2 && <span className={styles.ellipsis}>...</span>}
        </>
      )}
      {pages.map((page) => (
        <button
          key={page}
          className={`${styles.button} ${page === currentPage ? styles.active : ''}`}
          onClick={() => onPageChange(page)}
        >
          {page}
        </button>
      ))}
      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && <span className={styles.ellipsis}>...</span>}
          <button className={styles.button} onClick={() => onPageChange(totalPages)}>{totalPages}</button>
        </>
      )}
      <button
        className={styles.button}
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        aria-label="Вперёд"
      >
        <FontAwesomeIcon icon={faChevronRight} />
      </button>
    </div>
  );
}
