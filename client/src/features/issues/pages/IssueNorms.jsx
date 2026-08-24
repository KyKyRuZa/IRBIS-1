import { useState, useEffect } from 'react';
import { normsService } from '@/lib/services/norms.service.js';
import { itemsService } from '@/lib/services/items.service.js';
import { sitesService } from '@/lib/services/sites.service.js';
import { ITEM_CATEGORIES } from '@/lib/constants/item-categories.js';
import { useResource } from '@/hooks/useResource.js';
import Modal from '@/components/ui/Modal.jsx';
import Pagination from '@/components/ui/Pagination.jsx';
import ConfirmDialog from '@/components/ui/ConfirmDialog.jsx';
import styles from './IssueNorms.module.css';

const categories = ITEM_CATEGORIES;

export default function IssueNorms() {
  const [items, setItems] = useState([]);
  const [sites, setSites] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingNorm, setEditingNorm] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState({
    item_type_id: '',
    period_months: '',
    quantity: 1,
    gender: '',
    position: '',
    site_id: ''
  });

  const { data: norms, loading, error, refetch } = useResource(normsService.list);

  useEffect(() => {
    itemsService.list().then(setItems);
    sitesService.list().then(setSites);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [norms]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingNorm) {
      await normsService.update(editingNorm.id, formData);
      setEditingNorm(null);
    } else {
      await normsService.create(formData);
    }
    setFormData({ item_type_id: '', period_months: '', quantity: 1, gender: '', position: '', site_id: '' });
    setShowModal(false);
    refetch();
  };

  const handleEdit = (norm) => {
    setEditingNorm(norm);
    setFormData({
      item_type_id: norm.item_type_id || '',
      period_months: norm.period_months || '',
      quantity: norm.quantity || 1,
      gender: norm.gender || '',
      position: norm.position || '',
      site_id: norm.site_id || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    await normsService.delete(deleteId);
    refetch();
    setDeleteId(null);
  };

  const handleClose = () => {
    setShowModal(false);
    setEditingNorm(null);
    setFormData({ item_type_id: '', period_months: '', quantity: 1, gender: '', position: '', site_id: '' });
  };

  const startIndex = (currentPage - 1) * 10;
  const paginatedNorms = norms.slice(startIndex, startIndex + 10);

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.pageHeader}>
        <div className={`container ${styles.pageHeaderContent}`}>
          <div className={styles.title}>
            <h1>Нормы выдачи</h1>
            <div className={styles.subtitle}>Установленные нормы по должностям и периодичности</div>
          </div>
          <button className="btn" onClick={() => setShowModal(true)}>
            Добавить норму
          </button>
        </div>
      </div>
      <div className="container">
        <div className="card">
          {loading && <div className="card">Загрузка...</div>}
          {error && <div className={`card ${styles.error}`}>{error}</div>}
          {!loading && !error && (
            <>
              <table className={`table ${styles.tableWrapper}`}>
                <thead>
                  <tr>
                    <th>Наименование</th>
                    <th>Периодичность</th>
                    <th>Кол-во</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedNorms.map((norm) => (
                    <tr key={norm.id}>
                      <td>{norm.item_type_name}</td>
                      <td>{norm.period_months} мес</td>
                      <td>{norm.quantity}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn" onClick={() => handleEdit(norm)}>Редактировать</button>
                      <button className="btn btn-danger" onClick={() => handleDelete(norm.id)}>Удалить</button>
                    </div>
                  </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination
                totalItems={norms.length}
                itemsPerPage={10}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </div>
      </div>

      <Modal isOpen={showModal} onClose={handleClose} title={editingNorm ? 'Редактировать норму' : 'Добавить норму'}>
        <form onSubmit={handleSubmit} className={styles.formSection}>
          <div className={styles.formGrid}>
            <div className={`form-group ${styles.field}`}>
              <label>Наименование *</label>
              <select
                className="form-control"
                value={formData.item_type_id}
                onChange={(e) => setFormData({...formData, item_type_id: e.target.value})}
                required
              >
                <option value="">Выберите...</option>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({categories[item.category]})
                  </option>
                ))}
              </select>
            </div>
            <div className={`form-group ${styles.field}`}>
              <label>Периодичность (месяцы) *</label>
              <input
                type="number"
                className="form-control"
                value={formData.period_months}
                onChange={(e) => setFormData({...formData, period_months: e.target.value})}
                required
              />
            </div>
            <div className={`form-group ${styles.field}`}>
              <label>Количество</label>
              <input
                type="number"
                className="form-control"
                value={formData.quantity}
                onChange={(e) => setFormData({...formData, quantity: e.target.value})}
              />
            </div>
          </div>
          <div className={styles.actionButtons}>
            <button type="submit" className="btn">{editingNorm ? 'Сохранить' : 'Добавить норму'}</button>
            {editingNorm && <button type="button" className="btn btn-secondary" onClick={handleClose}>Отмена</button>}
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Удаление нормы"
        message="Вы уверены, что хотите удалить эту норму?"
      />
    </div>
  );
}
