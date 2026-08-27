import { useState, useEffect } from 'react';
import { normsService } from '@/lib/services/norms.service.js';
import { itemsService } from '@/lib/services/items.service.js';
import { ITEM_CATEGORIES } from '@/lib/constants/item-categories.js';
import { useResource } from '@/hooks/useResource.js';
import { useTableControls, useFilteredList } from '@/hooks/useTableControls.js';
import Modal from '@/components/ui/Modal.jsx';
import Pagination from '@/components/ui/Pagination.jsx';
import ConfirmDialog from '@/components/ui/ConfirmDialog.jsx';
import LoadingState from '@/components/ui/LoadingState.jsx';
import ErrorState from '@/components/ui/ErrorState.jsx';
import EmptyState from '@/components/ui/EmptyState.jsx';
import SortableTh from '@/components/ui/SortableTh.jsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClipboardList } from '@fortawesome/free-solid-svg-icons';
import styles from '@styles/IssueNorms.module.css';

const categories = ITEM_CATEGORIES;

export default function IssueNorms() {
  const [items, setItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingNorm, setEditingNorm] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [submitError, setSubmitError] = useState('');
  const [formData, setFormData] = useState({
    item_type_id: '',
    period_months: '',
    quantity: 1,
    position: ''
  });

  const { data: norms, loading, error, refetch } = useResource(normsService.list);

  const {
    search,
    searchApplied,
    setSearch,
    filters,
    setFilter,
    sort,
    toggleSort,
    resetFilters
  } = useTableControls({
    filters: { item_type_id: '' },
    sort: { key: 'item_type_name', dir: 'asc' }
  });

  useEffect(() => {
    itemsService.list().then(setItems);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchApplied, filters, sort, norms]);

  // Blank select/number inputs must not be sent: the API columns are integers
  // and an empty string is rejected by the database.
  const buildPayload = () => {
    const payload = {};
    Object.entries(formData).forEach(([key, value]) => {
      if (value === '' || value === null || value === undefined) return;
      payload[key] = value;
    });
    return payload;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    try {
      const payload = buildPayload();
      if (editingNorm) {
        await normsService.update(editingNorm.id, payload);
        setEditingNorm(null);
      } else {
        await normsService.create(payload);
      }
    setFormData({ item_type_id: '', period_months: '', quantity: 1, position: '' });
      setShowModal(false);
      refetch();
    } catch (err) {
      setSubmitError(err.response?.data?.error || 'Не удалось сохранить норму');
    }
  };

  const handleEdit = (norm) => {
    setEditingNorm(norm);
    setSubmitError('');
    setFormData({
      item_type_id: norm.item_type_id || '',
      period_months: norm.period_months || '',
      quantity: norm.quantity || 1,
      position: norm.position || ''
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
    setSubmitError('');
    setFormData({ item_type_id: '', period_months: '', quantity: 1, position: '' });
  };

  const filteredNorms = useFilteredList(norms, {
    search: searchApplied,
    filters: { item_type_id: filters.item_type_id },
    sort,
    searchFields: ['item_type_name', 'position']
  });

  const totalItems = filteredNorms.length;
  const startIndex = (currentPage - 1) * 10;
  const paginatedNorms = filteredNorms.slice(startIndex, startIndex + 10);

  const hasActiveFilters = Boolean(search) || filters.item_type_id !== '';

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.pageHeader}>
        <div className={`${styles.container} ${styles.pageHeaderContent}`}>
          <div className={styles.title}>
            <h1>Нормы выдачи</h1>
            <div className={styles.subtitle}>Установленные нормы по должностям и периодичности</div>
          </div>
          <button className="btn" onClick={() => { setSubmitError(''); setShowModal(true); }}>
            Добавить норму
          </button>
        </div>
      </div>
      <div className={styles.container}>
        <div className="card">
          <div className="table-controls">
            <div className="search-box">
              <input
                type="text"
                name="search"
                placeholder="Поиск по наименованию или должности..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="filter-field">
              <label>Наименование</label>
              <select value={filters.item_type_id} onChange={(e) => setFilter('item_type_id', e.target.value)}>
                <option value="">Все</option>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </div>
            {hasActiveFilters && (
              <button className="btn btn-secondary filter-reset" onClick={resetFilters}>
                Сбросить
              </button>
            )}
          </div>

          {loading && <LoadingState label="Загрузка норм..." />}
          {!loading && error && <ErrorState message={error} onRetry={refetch} />}
          {!loading && !error && (
            filteredNorms.length === 0 ? (
              <EmptyState
                icon={<FontAwesomeIcon icon={faClipboardList} />}
                title="Нормы не найдены"
                description={hasActiveFilters ? 'По заданным фильтрам ничего не найдено.' : 'Пока не добавлено ни одной нормы выдачи.'}
                action={<button className="btn" onClick={() => setShowModal(true)}>Добавить норму</button>}
              />
            ) : (
              <>
                 <div className="tableScroll">
                 <table className={`table ${styles.tableWrapper}`}>
                 <thead>
                  <tr>
                    <SortableTh label="Наименование" sortKey="item_type_name" sort={sort} onSort={toggleSort} />
                    <SortableTh label="Периодичность" sortKey="period_months" sort={sort} onSort={toggleSort} />
                    <SortableTh label="Кол-во" sortKey="quantity" sort={sort} onSort={toggleSort} />
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
              </div>
              <Pagination
                totalItems={totalItems}
                itemsPerPage={10}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
              />
              </>
            )
          )}
        </div>
      </div>

      <Modal isOpen={showModal} onClose={handleClose} title={editingNorm ? 'Редактировать норму' : 'Добавить норму'}>
        <form onSubmit={handleSubmit} className={styles.formSection}>
          {submitError && <div className={styles.error}>{submitError}</div>}
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
