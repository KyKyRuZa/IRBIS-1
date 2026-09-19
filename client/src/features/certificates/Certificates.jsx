import { useState, useEffect } from 'react';
import { certificatesService } from '@lib/services/certificates.service.js';
import { itemsService } from '@/lib/services/items.service.js';
import { uploadService } from '@/lib/services/upload.service.js';
import { CERTIFICATE_STATUSES, CERTIFICATE_STATUS_LABELS } from '@lib/constants/certificate-statuses.js';
import { formatDate } from '@/lib/utils/date.js';
import { toDateInput } from '@/lib/utils/date.js';
import { useTableControls, useFilteredList } from '@/hooks/useTableControls.js';
import { showError, showSuccess, showFieldErrors } from '@/lib/toast.js';
import { certificateSchema } from '@/lib/validation/forms.js';
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
import styles from '@styles/Certificates.module.css';

export default function Certificates() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [items, setItems] = useState([]);
  const [showExpired, setShowExpired] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingCertificate, setEditingCertificate] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [formData, setFormData] = useState({
    product_name: '',
    certificate_number: '',
    issue_date: '',
    expiry_date: '',
    item_type_id: ''
  });
  const [certificateFile, setCertificateFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [fieldErrors, setFieldErrors] = useState({});

  const {
    search,
    setSearch,
    filters,
    setFilter,
    sort,
    toggleSort,
    resetFilters
  } = useTableControls({
    filters: { status: '' },
    sort: { key: 'issue_date', dir: 'desc' }
  });

  useEffect(() => {
    fetchCertificates();
    fetchItems();
  }, []);

  const fetchCertificates = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await certificatesService.list();
      setCertificates(res);
    } catch (e) {
      setError(e.message || 'Ошибка загрузки сертификатов');
    } finally {
      setLoading(false);
    }
  };

  const fetchItems = async () => {
    const res = await itemsService.listRequiringCertificates();
    setItems(res);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    setFieldErrors({});
    try {
      const basePayload = {
        product_name: formData.product_name,
        certificate_number: formData.certificate_number || null,
        issue_date: formData.issue_date || null,
        expiry_date: formData.expiry_date,
        item_type_id: formData.item_type_id || null,
      };
      const result = certificateSchema.safeParse(basePayload);
      if (!result.success) {
        const fieldError = {};
        (result.error?.issues || []).forEach((err) => {
          fieldError[err.path.join('.')] = err.message;
        });
        setFieldErrors(fieldError);
        showFieldErrors(result.error?.issues || []);
        return;
      }
      if (editingCertificate) {
        if (certificateFile) {
          const fd = new FormData();
          fd.append('certificate', certificateFile);
          fd.append('product_name', result.data.product_name);
          fd.append('certificate_number', result.data.certificate_number || '');
          fd.append('issue_date', result.data.issue_date || '');
          fd.append('expiry_date', result.data.expiry_date || '');
          fd.append('item_type_id', result.data.item_type_id || '');
          await uploadService.uploadCertificate(fd);
        } else {
          await certificatesService.update(editingCertificate.id, result.data);
        }
        setEditingCertificate(null);
      } else {
        if (certificateFile) {
          const fd = new FormData();
          fd.append('certificate', certificateFile);
          fd.append('product_name', result.data.product_name);
          fd.append('certificate_number', result.data.certificate_number || '');
          fd.append('issue_date', result.data.issue_date || '');
          fd.append('expiry_date', result.data.expiry_date || '');
          fd.append('item_type_id', result.data.item_type_id || '');
          await uploadService.uploadCertificate(fd);
        } else {
          await certificatesService.create(result.data);
        }
      }
      const action = editingCertificate ? 'обновлён' : 'добавлен';
      showSuccess(`Сертификат "${result.data.product_name}" ${action}`);
      setFormData({ product_name: '', certificate_number: '', issue_date: '', expiry_date: '', item_type_id: '' });
      setCertificateFile(null);
      setShowModal(false);
      setFieldErrors({});
      fetchCertificates();
    } catch (err) {
      showError(err.response?.data?.error || 'Не удалось сохранить сертификат');
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (cert) => {
    setEditingCertificate(cert);
    setFormData({
      product_name: cert.product_name,
      certificate_number: cert.certificate_number || '',
      issue_date: toDateInput(cert.issue_date),
      expiry_date: toDateInput(cert.expiry_date),
      item_type_id: cert.item_type_id || ''
    });
    setCertificateFile(null);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    await certificatesService.delete(deleteId);
    fetchCertificates();
    setDeleteId(null);
  };

  const handleClose = () => {
    setShowModal(false);
    setEditingCertificate(null);
    setFormData({ product_name: '', certificate_number: '', issue_date: '', expiry_date: '', item_type_id: '' });
    setCertificateFile(null);
    setFieldErrors({});
  };

  const baseCerts = showExpired
    ? certificates.filter(c => c.status === CERTIFICATE_STATUSES.expired)
    : certificates;

  const filteredCerts = useFilteredList(baseCerts, {
    search,
    filters: { status: filters.status },
    sort,
    searchFields: ['product_name', 'certificate_number']
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [showExpired, search, filters, sort, certificates]);

  const startIndex = (currentPage - 1) * 10;
  const paginatedCerts = filteredCerts.slice(startIndex, startIndex + 10);

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.pageHeader}>
        <div className={`${styles.container} ${styles.pageHeaderContent}`}>
          <div className={styles.title}>
            <h1>Сертификаты соответствия</h1>
            <div className={styles.subtitle}>Контроль сроков действия и файлов сертификатов</div>
          </div>
          <button className="btn" onClick={() => setShowModal(true)}>
            Добавить сертификат
          </button>
        </div>
      </div>
      <div className={styles.container}>
        <div className="card">
          <div className="table-controls">
            <SearchBox
              value={search}
              onChange={setSearch}
              placeholder="Поиск по продукции или номеру..."
            />
            <FilterSelect label="Статус" value={filters.status} onChange={(value) => setFilter('status', value)}>
              <option value="">Все</option>
              <option value={CERTIFICATE_STATUSES.active}>{CERTIFICATE_STATUS_LABELS.active}</option>
              <option value={CERTIFICATE_STATUSES.expiring}>{CERTIFICATE_STATUS_LABELS.expiring}</option>
              <option value={CERTIFICATE_STATUSES.expired}>{CERTIFICATE_STATUS_LABELS.expired}</option>
            </FilterSelect>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={showExpired}
                onChange={(e) => setShowExpired(e.target.checked)}
              />
              <span>Показать просроченные</span>
            </label>
            {(Boolean(search) || filters.status !== '' || showExpired) && (
              <button className="btn btn-secondary filter-reset" onClick={() => { resetFilters(); setShowExpired(false); }}>
                <Icon name="rotateCcw" size={16} /> Сбросить
              </button>
            )}
          </div>

          {loading && <LoadingState label="Загрузка сертификатов..." />}
          {!loading && error && <ErrorState message={error} onRetry={fetchCertificates} />}
          {!loading && !error && (
            filteredCerts.length === 0 ? (
              <EmptyState
                icon={<Icon name="fileText" size={48} />}
                title="Сертификаты не найдены"
                description={(showExpired || Boolean(search) || filters.status !== '') ? 'По заданным фильтрам ничего не найдено.' : 'Нет активных сертификатов. Добавьте первый.'}
                action={<button className="btn" onClick={() => setShowModal(true)}><Icon name="plus" size={16} /> Добавить сертификат</button>}
              />
            ) : (
              <>
                 <div className="tableScroll">
                 <table className={`table ${styles.tableWrapper}`}>
                   <thead>
                    <tr>
                      <SortableTh label="Продукция" sortKey="product_name" sort={sort} onSort={toggleSort} />
                      <SortableTh label="Номер" sortKey="certificate_number" sort={sort} onSort={toggleSort} />
                      <SortableTh label="Дата выдачи" sortKey="issue_date" sort={sort} onSort={toggleSort} />
                      <SortableTh label="Срок действия" sortKey="expiry_date" sort={sort} onSort={toggleSort} />
                      <SortableTh label="Статус" sortKey="status" sort={sort} onSort={toggleSort} />
                      <th>Файл</th>
                      <th>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedCerts.map((cert) => (
                      <tr key={cert.id}>
                        <td>{cert.product_name}</td>
                        <td>{cert.certificate_number}</td>
                        <td>{formatDate(cert.issue_date)}</td>
                        <td>{formatDate(cert.expiry_date)}</td>
                        <td>
                          {cert.status === CERTIFICATE_STATUSES.active && <span className="badge badge-success">{CERTIFICATE_STATUS_LABELS.active}</span>}
                          {cert.status === CERTIFICATE_STATUSES.expiring && <span className="badge badge-warning">{CERTIFICATE_STATUS_LABELS.expiring}</span>}
                          {cert.status === CERTIFICATE_STATUSES.expired && <span className="badge badge-danger">{CERTIFICATE_STATUS_LABELS.expired}</span>}
                        </td>
                        <td>
                          {cert.file_path && (
                            <a className={styles.fileLink} href={cert.file_path} target="_blank" rel="noreferrer">Открыть файл</a>
                          )}
                          </td>
                          <td>
                          <div className="action-buttons">
                            <button className="btn action-btn" aria-label="Редактировать" data-tooltip="Редактировать" onClick={() => handleEdit(cert)}><Icon name="pencil" size={14} /></button>
                            <button className="btn btn-danger action-btn" aria-label="Удалить" data-tooltip="Удалить" onClick={() => handleDelete(cert.id)}><Icon name="trash" size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
                <Pagination
                  totalItems={filteredCerts.length}
                  itemsPerPage={10}
                  currentPage={currentPage}
                  onPageChange={setCurrentPage}
                />
              </>
            )
          )}
        </div>
      </div>

      <Modal isOpen={showModal} onClose={handleClose} title={editingCertificate ? 'Редактировать сертификат' : 'Добавить сертификат'} size="compact">
        <form onSubmit={handleSubmit} className={styles.formSection}>
          <div className={styles.formGrid}>
            <div className={`form-group ${styles.field}`}>
              <label>Продукция *</label>
              <input
                type="text"
                className="form-control"
                value={formData.product_name}
                onChange={(e) => setFormData({...formData, product_name: e.target.value})}
                required
                aria-invalid={Boolean(fieldErrors.product_name)}
                aria-describedby={fieldErrors.product_name ? 'product-error' : undefined}
              />
              {fieldErrors.product_name && <div id="product-error" className={styles.fieldError} role="alert">{fieldErrors.product_name}</div>}
            </div>
            <div className={`form-group ${styles.field}`}>
              <label>Номер сертификата</label>
              <input
                type="text"
                className="form-control"
                value={formData.certificate_number}
                onChange={(e) => setFormData({...formData, certificate_number: e.target.value})}
              />
            </div>
            <div className={`form-group ${styles.field}`}>
              <label>Дата выдачи</label>
              <input
                type="date"
                className="form-control"
                value={formData.issue_date}
                onChange={(e) => setFormData({...formData, issue_date: e.target.value})}
              />
            </div>
            <div className={`form-group ${styles.field}`}>
              <label>Срок действия *</label>
              <input
                type="date"
                className="form-control"
                value={formData.expiry_date}
                onChange={(e) => setFormData({...formData, expiry_date: e.target.value})}
                required
                aria-invalid={Boolean(fieldErrors.expiry_date)}
                aria-describedby={fieldErrors.expiry_date ? 'expiry-error' : undefined}
              />
              {fieldErrors.expiry_date && <div id="expiry-error" className={styles.fieldError} role="alert">{fieldErrors.expiry_date}</div>}
            </div>
            <div className={`form-group ${styles.field}`}>
              <label>Позиция номенклатуры</label>
              <select
                className="form-control"
                value={formData.item_type_id}
                onChange={(e) => setFormData({...formData, item_type_id: e.target.value})}
              >
                <option value="">Выберите...</option>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </div>
            <div className={`form-group ${styles.field}`}>
              <label>Файл сертификата (PDF/изображение)</label>
              <input
                type="file"
                className="form-control"
                accept=".pdf,.png,.jpg,.jpeg,.gif,.webp"
                onChange={(e) => setCertificateFile(e.target.files[0] || null)}
              />
            </div>
          </div>
          <div className={styles.actionButtons}>
            <button type="submit" className="btn" disabled={uploading}>{uploading ? 'Загрузка...' : (editingCertificate ? 'Сохранить' : 'Добавить сертификат')}</button>
            {editingCertificate && <button type="button" className="btn btn-secondary" onClick={handleClose}>Отмена</button>}
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Удаление сертификата"
        message="Вы уверены, что хотите удалить этот сертификат?"
      />
    </div>
  );
}