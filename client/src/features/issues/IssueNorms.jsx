import { useState, useEffect, useMemo } from 'react';
import { normsService } from '@/lib/services/norms.service.js';
import { itemsService } from '@/lib/services/items.service.js';
import { ITEM_CATEGORIES } from '@/lib/constants/item-categories.js';
import { useResource } from '@/hooks/useResource.js';
import { useTableControls } from '@/hooks/useTableControls.js';
import { showError, showSuccess, showFieldErrors } from '@/lib/toast.js';
import { normSchema } from '@/lib/validation/forms.js';
import Modal from '@components/ui/Modal.jsx';
import Pagination from '@components/ui/Pagination.jsx';
import ConfirmDialog from '@components/ui/ConfirmDialog.jsx';
import LoadingState from '@components/ui/LoadingState.jsx';
import ErrorState from '@components/ui/ErrorState.jsx';
import EmptyState from '@components/ui/EmptyState.jsx';
import SortableTh from '@components/ui/SortableTh.jsx';
import Icon from '@components/ui/Icon.jsx';
import SearchBox from '@components/ui/SearchBox.jsx';
import FilterSelect from '@components/ui/FilterSelect.jsx';
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
    filters: { item_type_id: '', period_months_from: '', period_months_to: '', quantity_from: '', quantity_to: '' },
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
      const result = normSchema.safeParse(payload);
      if (!result.success) {
        const fieldError = {};
        (result.error?.issues || []).forEach((err) => {
          fieldError[err.path.join('.')] = err.message;
        });
        showFieldErrors(result.error?.issues || []);
        return;
      }
      if (editingNorm) {
        await normsService.update(editingNorm.id, result.data);
        setEditingNorm(null);
        showSuccess('Норма обновлена');
      } else {
        await normsService.create(result.data);
        showSuccess('Норма добавлена');
      }
      setFormData({ item_type_id: '', period_months: '', quantity: 1, position: '' });
      setShowModal(false);
      refetch();
    } catch (err) {
      showError(err.response?.data?.error || 'Не удалось сохранить норму');
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

  const filteredNorms = useMemo(() => {
    let result = norms;

    const query = searchApplied.trim().toLowerCase();
    if (query) {
      result = result.filter((norm) =>
        String(norm.item_type_name || '').toLowerCase().includes(query) ||
        String(norm.position || '').toLowerCase().includes(query)
      );
    }

    if (filters.item_type_id) {
      result = result.filter((norm) => norm.item_type_id === Number(filters.item_type_id));
    }

    if (filters.period_months_from !== '' || filters.period_months_to !== '') {
      const periodFrom = Number(filters.period_months_from);
      const periodTo = Number(filters.period_months_to);
      if (!Number.isNaN(periodFrom) || !Number.isNaN(periodTo)) {
        result = result.filter((norm) => {
          const val = Number(norm.period_months);
          if (Number.isNaN(val)) return false;
          if (!Number.isNaN(periodFrom) && val < periodFrom) return false;
          if (!Number.isNaN(periodTo) && val > periodTo) return false;
          return true;
        });
      }
    }

    if (filters.quantity_from !== '' || filters.quantity_to !== '') {
      const qtyFrom = Number(filters.quantity_from);
      const qtyTo = Number(filters.quantity_to);
      if (!Number.isNaN(qtyFrom) || !Number.isNaN(qtyTo)) {
        result = result.filter((norm) => {
          const val = Number(norm.quantity);
          if (Number.isNaN(val)) return false;
          if (!Number.isNaN(qtyFrom) && val < qtyFrom) return false;
          if (!Number.isNaN(qtyTo) && val > qtyTo) return false;
          return true;
        });
      }
    }

    if (sort && sort.key) {
      const { key, dir } = sort;
      result = [...result].sort((a, b) => {
        const cmp = String(a[key] || '').localeCompare(String(b[key] || ''), 'ru');
        return dir === 'desc' ? -cmp : cmp;
      });
    }

    return result;
  }, [norms, searchApplied, filters, sort]);

  const totalItems = filteredNorms.length;
  const startIndex = (currentPage - 1) * 10;
  const paginatedNorms = filteredNorms.slice(startIndex, startIndex + 10);

  const hasActiveFilters = Boolean(search) || filters.item_type_id !== '' || Boolean(filters.period_months_from) || Boolean(filters.period_months_to) || Boolean(filters.quantity_from) || Boolean(filters.quantity_to);

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.pageHeader}>
        <div className={`${styles.container} ${styles.pageHeaderContent}`}>
          <div className={styles.title}>
            <h1>Нормы выдачи</h1>
            <div className={styles.subtitle}>Установленные нормы по должностям и периодичности</div>
          </div>
          <button className="btn" onClick={() => { setSubmitError(''); setShowModal(true); }}>
            <Icon name="plus" size={16} /> Добавить норму
          </button>
        </div>
      </div>
      <div className={styles.container}>
        <div className="card">
          <div className="table-controls">
            <SearchBox
              value={search}
              onChange={setSearch}
              placeholder="Поиск по наименованию или должности..."
            />
            <FilterSelect label="Наименование" value={filters.item_type_id} onChange={(value) => setFilter('item_type_id', value)}>
              <option value="">Все</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </FilterSelect>
            <div className="filter-field narrow">
              <label>Период от (мес)</label>
              <input type="number" value={filters.period_months_from} onChange={(e) => setFilter('period_months_from', e.target.value)} />
            </div>
            <div className="filter-field narrow">
              <label>Период до (мес)</label>
              <input type="number" value={filters.period_months_to} onChange={(e) => setFilter('period_months_to', e.target.value)} />
            </div>
            <div className="filter-field narrow">
              <label>Кол-во от</label>
              <input type="number" value={filters.quantity_from} onChange={(e) => setFilter('quantity_from', e.target.value)} />
            </div>
            <div className="filter-field narrow">
              <label>Кол-во до</label>
              <input type="number" value={filters.quantity_to} onChange={(e) => setFilter('quantity_to', e.target.value)} />
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
                icon={<Icon name="clipboardList" size={48} />}
                title="Нормы не найдены"
                description={hasActiveFilters ? 'По заданным фильтрам ничего не найдено.' : 'Пока не добавлено ни одной нормы выдачи.'}
                action={<button className="btn" onClick={() => setShowModal(true)}><Icon name="plus" size={16} /> Добавить норму</button>}
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
                      <button className="btn action-btn" aria-label="Редактировать" data-tooltip="Редактировать" onClick={() => handleEdit(norm)}><Icon name="pencil" size={14} /></button>
                      <button className="btn btn-danger action-btn" aria-label="Удалить" data-tooltip="Удалить" onClick={() => handleDelete(norm.id)}><Icon name="trash" size={14} /></button>
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

      <Modal isOpen={showModal} onClose={handleClose} title={editingNorm ? 'Редактировать норму' : 'Добавить норму'} size="compact">
        <form onSubmit={handleSubmit} className={styles.formSection}>
          {submitError && <div className={styles.error} role="alert">{submitError}</div>}
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
