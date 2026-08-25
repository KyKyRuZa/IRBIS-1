import { useEffect } from 'react';
import styles from '@styles/Modal.module.css';

export default function Modal({ isOpen, onClose, title, children }) {
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.content} onClick={(e) => e.stopPropagation()}>
        {title && <h3 className={styles.header}>{title}</h3>}
        <button className={styles.closeButton} onClick={onClose} aria-label="Close">
          &times;
        </button>
        {children}
      </div>
    </div>
  );
}
