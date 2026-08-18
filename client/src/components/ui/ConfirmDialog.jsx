import { useState } from 'react';
import Modal from '@components/ui/Modal.jsx';
import styles from './ConfirmDialog.module.css';

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmText = 'Подтвердить', cancelText = 'Отмена' }) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <p className={styles.message}>{message}</p>
      <div className={styles.actions}>
        <button className="btn btn-secondary" onClick={onClose} disabled={loading}>{cancelText}</button>
        <button className="btn" onClick={handleConfirm} disabled={loading}>{loading ? '...' : confirmText}</button>
      </div>
    </Modal>
  );
}
