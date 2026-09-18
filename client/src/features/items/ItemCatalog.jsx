import { useState, useEffect, useMemo } from 'react';
import { itemsService } from '@/lib/services/items.service.js';
import { certificatesService } from '@/lib/services/certificates.service.js';
import { ITEM_CATEGORIES } from '@/lib/constants/item-categories.js';
import { SEASONALITY } from '@/lib/constants/seasonality.js';
import { CERTIFICATE_STATUSES, CERTIFICATE_STATUS_LABELS } from '@/lib/constants/certificate-statuses.js';
import { formatDate } from '@/lib/utils/date.js';
import { useTableControls, useFilteredList } from '@/hooks/useTableControls.js';
import { showError, showSuccess, showFieldErrors } from '@/lib/toast.js';
import { itemSchema } from '@/lib/validation/forms.js';
import Modal from '@components/ui/Modal.jsx';
import ConfirmDialog from '@components/ui/ConfirmDialog.jsx';
import Pagination from '@/components/ui/Pagination.jsx';
import LoadingState from '@/components/ui/LoadingState.jsx';
import ErrorState from '@/components/ui/ErrorState.jsx';
import EmptyState from '@/components/ui/EmptyState.jsx';
import SortableTh from '@/components/ui/SortableTh.jsx';
import Icon from '@components/ui/Icon.jsx';
import SearchBox from '@components/ui/SearchBox.jsx';
import FilterSelect from '@components/ui/FilterSelect.jsx';
import styles from '@styles/ItemCatalog.module.css';

const categories = ITEM_CATEGORIES;
const seasonality = SEASONALITY;

export default function ItemCatalog() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [category, setCategory] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [detailsModal, setDetailsModal] = useState({ open: false, loading: false, item: null });
  const [deleteId, setDeleteId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [fieldErrors, setFieldErrors] = useState({});

  const [formData, setFormData] = useState({
    name: '',
    category: 'consumable',
    unit: 'шт',
    default_wear_time: '',
    seasonality: 'year_round',
    requires_certificate: false
  });

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
    filters: { seasonality: '', requires_certificate: '', default_wear_time_from: '', default_wear_time_to: '' },
    sort: { key: 'name', dir: 'asc' }
  });

  useEffect(() => {
    fetchItems();
  }, [category]);

  useEffect(() => {
    setCurrentPage(1);
  }, [category, items, searchApplied, filters, sort]);

  const fetchItems = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await itemsService.list(category);
      setItems(res);
    } catch (e) {
      setError(e.message || 'Ошибка загрузки номенклатуры');
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = useMemo(() => {
    let result = items;

    const query = searchApplied.trim().toLowerCase();
    if (query) {
      result = result.filter((item) =>
        String(item.name || '').toLowerCase().includes(query)
      );
    }

    if (filters.seasonality) {
      result = result.filter((item) => item.seasonality === filters.seasonality);
    }
    if (filters.requires_certificate !== '') {
      const val = filters.requires_certificate === 'true';
      result = result.filter((item) => item.requires_certificate === val);
    }
    if (filters.default_wear_time_from !== '' || filters.default_wear_time_to !== '') {
      const from = Number(filters.default_wear_time_from);
      const to = Number(filters.default_wear_time_to);
      if (!Number.isNaN(from) || !Number.isNaN(to)) {
        result = result.filter((item) => {
          const itemVal = Number(item.default_wear_time);
          if (Number.isNaN(itemVal)) return false;
          if (!Number.isNaN(from) && itemVal < from) return false;
          if (!Number.isNaN(to) && itemVal > to) return false;
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
  }, [items, searchApplied, filters, sort]);

  const totalItems = filteredItems.length;
  const startIndex = (currentPage - 1) * 10;
  const paginatedItems = filteredItems.slice(startIndex, startIndex + 10);

  const hasActiveFilters = Boolean(search) || Boolean(filters.seasonality) || filters.requires_certificate !== '' || Boolean(filters.default_wear_time_from) || Boolean(filters.default_wear_time_to);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});
    const data = { ...formData };
    if (data.default_wear_time === '') data.default_wear_time = null;
    const result = itemSchema.safeParse(data);
    if (!result.success) {
      const fieldError = {};
      (result.error?.issues || []).forEach((err) => {
        fieldError[err.path.join('.')] = err.message;
      });
      setFieldErrors(fieldError);
      showFieldErrors(result.error?.issues || []);
      return;
    }
    try {
      if (editingItem) {
        await itemsService.update(editingItem.id, result.data);
        setEditingItem(null);
        showSuccess('Позиция обновлена');
      } else {
        await itemsService.create(result.data);
        showSuccess('Позиция добавлена');
      }
      setFormData({ name: '', category: 'consumable', unit: 'шт', default_wear_time: '', seasonality: 'year_round', requires_certificate: false });
      setShowModal(false);
      fetchItems();
    } catch (err) {
      showError(err.response?.data?.error || 'Не удалось сохранить позицию');
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      unit: item.unit || 'шт',
      default_wear_time: item.default_wear_time || '',
      seasonality: item.seasonality || 'year_round',
      requires_certificate: item.requires_certificate || false
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    await itemsService.delete(deleteId);
    fetchItems();
    if (detailsModal.item && detailsModal.item.id === deleteId) closeDetails();
    setDeleteId(null);
  };

  const handleCancel = () => {
    setEditingItem(null);
    setShowModal(false);
    setFormData({ name: '', category: 'consumable', unit: 'шт', default_wear_time: '', seasonality: 'year_round', requires_certificate: false });
    setFieldErrors({});
  };

  const showDetails = async (item) => {
    setDetailsModal({ open: true, loading: true, item: null });
    try {
      const [itemRes, certRes] = await Promise.all([
        itemsService.get(item.id),
        certificatesService.listByItem(item.id)
      ]);
      setDetailsModal({ open: true, loading: false, item: { ...itemRes, certificates: certRes } });
    } catch (error) {
      console.error('Failed to load item details:', error);
      setDetailsModal({ open: false, loading: false, item: null });
    }
  };

  const closeDetails = () => {
    setDetailsModal({ open: false, loading: false, item: null });
  };

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.pageHeader}>
        <div className={`${styles.container} ${styles.pageHeaderContent}`}>
          <div className={styles.title}>
            <h1>Номенклатура</h1>
            <div className={styles.subtitle}>Справочник спецодежды, обуви и СИЗ</div>
          </div>
          <button className="btn" onClick={() => { setEditingItem(null); setFormData({ name: '', category: 'consumable', unit: 'шт', default_wear_time: '', seasonality: 'year_round', requires_certificate: false }); setShowModal(true); }}>
            Добавить позицию
          </button>
        </div>
      </div>
      <div className={styles.container}>
        <div className="card">
          <div className="table-controls">
            <SearchBox
              value={search}
              onChange={setSearch}
              placeholder="Поиск по наименованию..."
            />
            <FilterSelect label="Сезонность" value={filters.seasonality} onChange={(value) => setFilter('seasonality', value)}>
              <option value="">Все</option>
              {Object.entries(seasonality).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </FilterSelect>
            <FilterSelect label="Сертификат" value={filters.requires_certificate} onChange={(value) => setFilter('requires_certificate', value)}>
              <option value="">Все</option>
              <option value="true">Требуется</option>
              <option value="false">Не требуется</option>
            </FilterSelect>
            <div className="filter-field">
              <label>Срок от (мес)</label>
              <input type="number" value={filters.default_wear_time_from} onChange={(e) => setFilter('default_wear_time_from', e.target.value)} />
            </div>
            <div className="filter-field">
              <label>Срок до (мес)</label>
              <input type="number" value={filters.default_wear_time_to} onChange={(e) => setFilter('default_wear_time_to', e.target.value)} />
            </div>
            {hasActiveFilters && (
              <button className="btn btn-secondary filter-reset" onClick={resetFilters}>
                <Icon name="rotateCcw" size={16} /> Сбросить
              </button>
            )}
          </div>
          <div className={styles.tabs}>
            <button
              className={!category ? styles.tabActive : styles.tab}
              onClick={() => { setCategory(''); fetchItems(); }}
            >Все</button>
            {Object.entries(categories).map(([key, label]) => (
              <button
                key={key}
                className={category === key ? styles.tabActive : styles.tab}
                onClick={() => { setCategory(key); fetchItems(); }}
              >{label}</button>
            ))}
          </div>

          {loading && <LoadingState label="Загрузка номенклатуры..." />}
          {!loading && error && <ErrorState message={error} onRetry={fetchItems} />}
          {!loading && !error && (
            filteredItems.length === 0 ? (
              <EmptyState
                icon={<Icon name="package" size={48} />}
                title="Позиции не найдены"
                description={hasActiveFilters ? 'По заданным фильтрам ничего не найдено.' : (category ? 'В выбранной категории пока нет позиций.' : 'Номенклатура пуста. Добавьте первую позицию.')}
                action={<button className="btn" onClick={() => { setEditingItem(null); setFormData({ name: '', category: 'consumable', unit: 'шт', default_wear_time: '', seasonality: 'year_round', requires_certificate: false }); setShowModal(true); }}><Icon name="plus" size={16} /> Добавить позицию</button>}
              />
            ) : (
              <>
                 <div className="tableScroll">
                 <table className="table">
                  <thead>
                   <tr>
                     <SortableTh label="Наименование" sortKey="name" sort={sort} onSort={toggleSort} />
                     <SortableTh label="Категория" sortKey="category" sort={sort} onSort={toggleSort} />
                     <SortableTh label="Срок (мес)" sortKey="default_wear_time" sort={sort} onSort={toggleSort} />
                     <SortableTh label="Сезон" sortKey="seasonality" sort={sort} onSort={toggleSort} />
                     <th>Сертификат</th>
                     <th>Действия</th>
                   </tr>
                 </thead>
                 <tbody>
                   {paginatedItems.map((item) => (
                     <tr key={item.id}>
                       <td>{item.name}</td>
                       <td>{categories[item.category]}</td>
                       <td>{item.default_wear_time || '-'}</td>
                       <td>{seasonality[item.seasonality] || '-'}</td>
                       <td>
                         {item.requires_certificate ? (
                           <span className="badge badge-warning">Требуется</span>
                         ) : (
                           <span className="badge badge-success">Не требуется</span>
                         )}
                       </td>
                       <td>
                          <div className="action-buttons">
                            <button className="btn action-btn" aria-label="Подробнее" data-tooltip="Подробнее" onClick={() => showDetails(item)}><Icon name="eye" size={14} /></button>
                            <button className="btn action-btn" aria-label="Редактировать" data-tooltip="Редактировать" onClick={() => handleEdit(item)}><Icon name="pencil" size={14} /></button>
                            <button className="btn btn-danger action-btn" aria-label="Удалить" data-tooltip="Удалить" onClick={() => handleDelete(item.id)}><Icon name="trash" size={14} /></button>
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

       <Modal isOpen={detailsModal.open} onClose={closeDetails} title={detailsModal.item ? detailsModal.item.name : 'Подробнее'}>
         {detailsModal.loading && (
           <div className={styles.loadingState}>
             <div className={styles.spinner}></div>
             <div className={styles.loadingText}>Загрузка подробных данных...</div>
           </div>
         )}
         {detailsModal.item && !detailsModal.loading && (
           <div className={styles.detailCard}>
             <div className={styles.detailsGrid}>
               <div className={styles.detailField}>
                 <span className={styles.detailFieldLabel}>Категория</span>
                 <span className={styles.detailFieldValue}>{categories[detailsModal.item.category]}</span>
               </div>
               <div className={styles.detailField}>
                 <span className={styles.detailFieldLabel}>Единица измерения</span>
                 <span className={styles.detailFieldValue}>{detailsModal.item.unit || '-'}</span>
               </div>
               <div className={styles.detailField}>
                 <span className={styles.detailFieldLabel}>Срок годности</span>
                 <span className={styles.detailFieldValue}>{detailsModal.item.default_wear_time || '-'} мес.</span>
               </div>
               <div className={styles.detailField}>
                 <span className={styles.detailFieldLabel}>Сезонность</span>
                 <span className={styles.detailFieldValue}>{seasonality[detailsModal.item.seasonality] || '-'}</span>
               </div>
               <div className={styles.detailField}>
                 <span className={styles.detailFieldLabel}>Требуется сертификат</span>
                 <span className={styles.detailFieldValue}>{detailsModal.item.requires_certificate ? 'Да' : 'Нет'}</span>
               </div>
             </div>

             <div className={styles.certificatesSection}>
               <h4 className={styles.certificatesTitle}>Сертификаты</h4>
               {detailsModal.item.certificates && detailsModal.item.certificates.length > 0 ? (
                  <div className="tableScroll">
                  <table className={`${styles.certificatesTable} table`}>
                    <thead>
                     <tr>
                       <th>Номер</th>
                       <th>Дата выдачи</th>
                       <th>Срок действия</th>
                       <th>Статус</th>
                     </tr>
                   </thead>
                   <tbody>
                     {detailsModal.item.certificates.map((cert) => (
                       <tr key={cert.id}>
                         <td>{cert.certificate_number}</td>
                          <td>{formatDate(cert.issue_date)}</td>
                          <td>{formatDate(cert.expiry_date)}</td>
                         <td>
                           {cert.status === CERTIFICATE_STATUSES.active && <span className="badge badge-success">{CERTIFICATE_STATUS_LABELS.active}</span>}
                           {cert.status === CERTIFICATE_STATUSES.expiring && <span className="badge badge-warning">{CERTIFICATE_STATUS_LABELS.expiring}</span>}
                           {cert.status === CERTIFICATE_STATUSES.expired && <span className="badge badge-danger">{CERTIFICATE_STATUS_LABELS.expired}</span>}
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
                 </div>
               ) : (
                 <div className={styles.emptyCertificates}>Сертификаты отсутствуют</div>
               )}
             </div>
           </div>
         )}
       </Modal>
     </div>

     <Modal isOpen={showModal} onClose={handleCancel} title={editingItem ? 'Редактировать позицию' : 'Новая позиция'} size="compact">
       <form onSubmit={handleSubmit} className={styles.formSection}>
         <div className={styles.formGrid}>
           <div className={`form-group ${styles.field}`}>
             <label>Наименование *</label>
             <input
               type="text"
               className="form-control"
               value={formData.name}
               onChange={(e) => setFormData({...formData, name: e.target.value})}
               required
               aria-invalid={Boolean(fieldErrors.name)}
               aria-describedby={fieldErrors.name ? 'item-name-error' : undefined}
             />
             {fieldErrors.name && <div id="item-name-error" className={styles.fieldError} role="alert">{fieldErrors.name}</div>}
           </div>
           <div className={`form-group ${styles.field}`}>
             <label>Категория *</label>
             <select
               className="form-control"
               value={formData.category}
               onChange={(e) => {
                 const cat = e.target.value;
                 setFormData({
                   ...formData,
                   category: cat,
                   requires_certificate: cat === 'siz' ? true : formData.requires_certificate
                 });
               }}
               aria-invalid={Boolean(fieldErrors.category)}
               aria-describedby={fieldErrors.category ? 'item-category-error' : undefined}
             >
               {Object.entries(categories).map(([key, label]) => (
                 <option key={key} value={key}>{label}</option>
               ))}
             </select>
             {fieldErrors.category && <div id="item-category-error" className={styles.fieldError} role="alert">{fieldErrors.category}</div>}
           </div>
           <div className={`form-group ${styles.field}`}>
             <label>Единица измерения</label>
             <input
               type="text"
               className="form-control"
               value={formData.unit}
               onChange={(e) => setFormData({...formData, unit: e.target.value})}
             />
           </div>

           <details className={styles.sizesGroup}>
             <summary>Сроки и сертификация</summary>
             <div className={styles.formGrid}>
               <div className={`form-group ${styles.field}`}>
                 <label>Срок годности (мес)</label>
                 <input
                   type="number"
                   className="form-control"
                   value={formData.default_wear_time}
                   onChange={(e) => setFormData({...formData, default_wear_time: e.target.value})}
                 />
               </div>
               <div className={`form-group ${styles.field}`}>
                 <label>Сезонность</label>
                 <select
                   className="form-control"
                   value={formData.seasonality}
                   onChange={(e) => setFormData({...formData, seasonality: e.target.value})}
                 >
                   <option value="year_round">Круглогодичная</option>
                   <option value="winter">Зимняя</option>
                   <option value="summer">Летняя</option>
                 </select>
               </div>
               <div className={`form-group ${styles.field}`}>
                 <div className={styles.checkboxRow}>
                   <span>Требуется сертификат</span>
                   <input
                     type="checkbox"
                     checked={formData.requires_certificate}
                     onChange={(e) => setFormData({...formData, requires_certificate: e.target.checked})}
                   />
                 </div>
               </div>
             </div>
           </details>
         </div>
         <div className={styles.actionButtons}>
           <button type="submit" className="btn">{editingItem ? 'Сохранить' : 'Добавить'}</button>
           {editingItem && <button type="button" className="btn btn-secondary" onClick={handleCancel}>Отмена</button>}
         </div>
       </form>
     </Modal>

     <ConfirmDialog
       isOpen={Boolean(deleteId)}
       onClose={() => setDeleteId(null)}
       onConfirm={confirmDelete}
       title="Удаление позиции"
       message="Вы уверены, что хотите удалить эту позицию?"
     />
   </div>
 );
}
