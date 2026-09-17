import { useState, useEffect, useMemo } from 'react';
import { employeesService } from '@/lib/services/employees.service.js';
import { itemsService } from '@/lib/services/items.service.js';
import { sitesService } from '@/lib/services/sites.service.js';
import { certificatesService } from '@/lib/services/certificates.service.js';
import { issuesService } from '@/lib/services/issues.service.js';
import { uploadService } from '@/lib/services/upload.service.js';
import { useAuth } from '@/hooks/useAuth.js';
import { useLocation } from 'react-router-dom';
import { ISSUE_STATUSES, ISSUE_STATUS_LABELS } from '@/lib/constants/issue-statuses.js';
import { ISSUE_METHODS, ISSUE_METHOD_VALUES } from '@/lib/constants/issue-methods.js';
import { useResource } from '@/hooks/useResource.js';
import { useFormState } from '@/hooks/useFormState.js';
import { useTableControls, useFilteredList } from '@/hooks/useTableControls.js';
import { showError, showSuccess, showFieldErrors } from '@/lib/toast.js';
import { issueSchema, issueBatchSchema, issueBatchSingleSchema, issueUpdateSchema } from '@/lib/validation/forms.js';
import Modal from '@/components/ui/Modal.jsx';
import ConfirmDialog from '@/components/ui/ConfirmDialog.jsx';
import Pagination from '@/components/ui/Pagination.jsx';
import LoadingState from '@/components/ui/LoadingState.jsx';
import ErrorState from '@/components/ui/ErrorState.jsx';
import EmptyState from '@/components/ui/EmptyState.jsx';
import SortableTh from '@/components/ui/SortableTh.jsx';
import Icon from '@components/ui/Icon.jsx';
import styles from '@styles/IssueForm.module.css';

const formInitialState = {
  employee_id: '',
  item_type_id: '',
  quantity: 1,
  certificate_id: '',
  wear_time_override: '',
  signature_path: '',
  notes: '',
  issue_method: 'personal'
};

export default function IssueForm() {
  const { isAdmin } = useAuth();
  const location = useLocation();

  const [employees, setEmployees] = useState([]);
  const [items, setItems] = useState([]);
  const [sites, setSites] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [lastSignature, setLastSignature] = useState(null);
  const [issueMode, setIssueMode] = useState('group');
  const [selectedSite, setSelectedSite] = useState('');
  const [signatureFile, setSignatureFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [disposeId, setDisposeId] = useState(null);
  const [editingRecord, setEditingRecord] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [batchItems, setBatchItems] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});

  const form = useFormState(formInitialState);
  const { data: records, loading, error, refetch: refetchRecords } = useResource(issuesService.list);

  const {
    search,
    setSearch,
    filters,
    setFilter,
    sort,
    toggleSort,
    resetFilters
  } = useTableControls({
    filters: { employee_id: '', site_id: '', item_type_id: '', status: '', date_from: '', date_to: '' },
    sort: { key: 'issue_date', dir: 'desc' }
  });

  const dateFilteredRecords = useMemo(() => records.filter((r) => {
    const rDate = (r.issue_date || '').slice(0, 10);
    if (filters.date_from && rDate && rDate < filters.date_from) return false;
    if (filters.date_to && rDate && rDate > filters.date_to) return false;
    return true;
  }), [records, filters.date_from, filters.date_to]);

  const filteredRecords = useFilteredList(dateFilteredRecords, {
    search,
    filters: {
      employee_id: filters.employee_id,
      site_id: filters.site_id,
      item_type_id: filters.item_type_id,
      status: filters.status
    },
    sort,
    searchFields: ['full_name', 'item_type_name']
  });

  const hasActiveFilters = Boolean(search) ||
    filters.employee_id !== '' || filters.site_id !== '' ||
    filters.item_type_id !== '' || filters.status !== '' ||
    filters.date_from !== '' || filters.date_to !== '';

  useEffect(() => {
    employeesService.list().then(setEmployees);
    itemsService.list().then(setItems);
    sitesService.list().then(setSites);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const employeeId = params.get('employee_id');
    if (employeeId) {
      setFilter('employee_id', employeeId);
    }
  }, [location.search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filters, sort, records]);

  const handleItemChange = async (itemId) => {
    form.setMany({ item_type_id: itemId });
    if (itemId) {
      const certs = await certificatesService.listByItem(itemId);
      setCertificates(certs);
    }
  };

  const handleSiteChange = (siteId) => setSelectedSite(siteId);

  const emptyBatchItem = () => ({ item_type_id: '', quantity: 1, certificate_id: '', issue_method: 'personal', notes: '' });

  const addBatchItem = () => setBatchItems(prev => [...prev, emptyBatchItem()]);
  const removeBatchItem = (index) => setBatchItems(prev => prev.filter((_, i) => i !== index));
  const updateBatchItem = (index, patch) => setBatchItems(prev => prev.map((item, i) => i === index ? { ...item, ...patch } : item));

  const handleBatchItemChange = async (index, itemId) => {
    updateBatchItem(index, { item_type_id: itemId, certificate_id: '' });
    if (itemId) {
      const certs = await certificatesService.listByItem(itemId);
      setCertificates(certs);
    }
  };

  // The edited employee may no longer be active (and thus absent from the
  // loaded list), so always keep them selectable in the dropdown.
  const visibleEmployees = selectedEmployee
    ? [...employees, selectedEmployee].filter(
        (emp, index, all) => all.findIndex((e) => e.id === emp.id) === index
      )
    : employees;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    setFieldErrors({});
    try {
      let record;
      if (issueMode === 'batch-single') {
        const rawItems = batchItems
          .filter(bi => bi.item_type_id)
          .map(bi => ({
            item_type_id: bi.item_type_id,
            quantity: bi.quantity || 1,
            certificate_id: bi.certificate_id || null,
            wear_time_override: bi.wear_time_override || null,
            notes: bi.notes || null,
            issue_method: bi.issue_method || 'personal',
          }));
        const batchResult = issueBatchSingleSchema.safeParse({
          employee_id: form.values.employee_id,
          issue_date: form.values.issue_date || null,
          items: rawItems,
        });
        if (!batchResult.success) {
          const fieldError = {};
          (batchResult.error?.issues || []).forEach((err) => {
            const key = err.path.join('.');
            fieldError[key] = err.message;
          });
          setFieldErrors(fieldError);
          showFieldErrors(batchResult.error?.issues || []);
          return;
        }
        const items = rawItems.map(bi => {
          const itemTypeId = Number(bi.item_type_id);
          const quantity = Number(bi.quantity);
          const certId = bi.certificate_id ? Number(bi.certificate_id) : null;
          const wearTime = bi.wear_time_override ? Number(bi.wear_time_override) : null;
          if (Number.isNaN(itemTypeId) || Number.isNaN(quantity) || (bi.certificate_id && Number.isNaN(certId)) || (bi.wear_time_override && Number.isNaN(wearTime))) {
            throw new Error('Некорректные числовые значения в позициях');
          }
          return {
            item_type_id: itemTypeId,
            quantity,
            certificate_id: certId,
            wear_time_override: wearTime,
            notes: bi.notes || null,
            issue_method: bi.issue_method || 'personal',
          };
        });
        if (items.length === 0) {
          showError('Нет позиций для выдачи. Добавьте хотя бы одну.');
          return;
        }
        const res = await issuesService.batchSingleCreate({
          employee_id: Number(batchResult.data.employee_id),
          issue_date: batchResult.data.issue_date || null,
          items,
        });
        record = res.records?.[0];
      } else {
        const baseData = {
          item_type_id: form.values.item_type_id,
          quantity: form.values.quantity,
          certificate_id: form.values.certificate_id,
          wear_time_override: form.values.wear_time_override,
          notes: form.values.notes,
          issue_method: form.values.issue_method || 'personal',
        };
        let payload;
        if (issueMode === 'group') {
          const result = issueBatchSchema.safeParse({ site_id: selectedSite, ...baseData });
          if (!result.success) {
            const fieldError = {};
            (result.error?.issues || []).forEach((err) => {
              fieldError[err.path.join('.')] = err.message;
            });
            setFieldErrors(fieldError);
            showFieldErrors(result.error?.issues || []);
            return;
          }
          payload = result.data;
        } else {
          const result = issueSchema.safeParse({ employee_id: form.values.employee_id, ...baseData });
          if (!result.success) {
            const fieldError = {};
            (result.error?.issues || []).forEach((err) => {
              fieldError[err.path.join('.')] = err.message;
            });
            setFieldErrors(fieldError);
            showFieldErrors(result.error?.issues || []);
            return;
          }
          payload = result.data;
        }
        if (issueMode === 'group') {
          const res = await issuesService.batchCreate({
            site_id: payload.site_id,
            ...payload,
          });
          record = res.records?.[0];
        } else {
          const res = await issuesService.create({
            employee_id: payload.employee_id,
            ...payload,
            signature_path: form.values.signature_path,
          });
          record = res;
        }

      if (record) {
        const modeLabel = issueMode === 'group' ? 'Групповая выдача' : issueMode === 'batch-single' ? 'Несколько позиций' : 'Одиночная выдача';
        showSuccess(`${modeLabel} создана${record.id ? `, ID ${record.id}` : ''}`);
      }
      }

      if (signatureFile && record?.id) {
        const fd = new FormData();
        fd.append('signature', signatureFile);
        fd.append('issue_record_id', record.id);
        const sigRes = await uploadService.uploadSignature(fd);
        setLastSignature(sigRes.signature_path || null);
      } else {
        setLastSignature(null);
      }

      form.reset();
      setSignatureFile(null);
      setCertificates([]);
      setShowModal(false);
      setFieldErrors({});
      refetchRecords();
    } catch (err) {
      showError(err.response?.data?.error || 'Не удалось сохранить выдачу');
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    setSelectedEmployee(
      record.employee_id
        ? { id: record.employee_id, full_name: record.full_name, position: record.position }
        : null
    );
    form.setMany({
      employee_id: record.employee_id || '',
      item_type_id: record.item_type_id || '',
      quantity: record.quantity || 1,
      certificate_id: record.certificate_id || '',
      wear_time_override: record.wear_time_override_months || '',
      notes: record.notes || '',
      issue_method: record.issue_method || 'personal'
    });
    setShowModal(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setUploading(true);
    setFieldErrors({});
    try {
      const baseData = {
        employee_id: form.values.employee_id,
        item_type_id: form.values.item_type_id,
        quantity: form.values.quantity,
        certificate_id: form.values.certificate_id,
        wear_time_override: form.values.wear_time_override,
        notes: form.values.notes,
        issue_method: form.values.issue_method || 'personal',
      };
      const result = issueUpdateSchema.safeParse(baseData);
      if (!result.success) {
        const fieldError = {};
        (result.error?.issues || []).forEach((err) => {
          fieldError[err.path.join('.')] = err.message;
        });
        setFieldErrors(fieldError);
        showFieldErrors(result.error?.issues || []);
        return;
      }
      await issuesService.update(editingRecord.id, result.data);
      showSuccess('Выдача обновлена');
      form.reset();
      setEditingRecord(null);
      setShowModal(false);
      setCertificates([]);
      setFieldErrors({});
      refetchRecords();
    } catch (err) {
      showError(err.response?.data?.error || 'Не удалось обновить выдачу');
    } finally {
      setUploading(false);
    }
  };

  const confirmDispose = async () => {
    if (!disposeId) return;
    await issuesService.dispose(disposeId);
    refetchRecords();
    setDisposeId(null);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    await issuesService.delete(deleteId);
    refetchRecords();
    setDeleteId(null);
  };

  const handleClose = () => {
    setShowModal(false);
    setEditingRecord(null);
    setSelectedEmployee(null);
    form.reset();
    setSignatureFile(null);
    setCertificates([]);
    setLastSignature(null);
    setIssueMode('group');
    setSelectedSite('');
    setBatchItems([]);
    setFieldErrors({});
  };

  const totalItems = filteredRecords.length;
  const startIndex = (currentPage - 1) * 10;
  const paginatedRecords = filteredRecords.slice(startIndex, startIndex + 10);

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.pageHeader}>
        <div className={`${styles.container} ${styles.pageHeaderContent}`}>
          <div className={styles.title}>
            <h1>Выдача спецодежды и СИЗ</h1>
            <div className={styles.subtitle}>Оперативная выдача, групповая раздача и возвраты</div>
          </div>
          {isAdmin && (
          <button className="btn" onClick={() => setShowModal(true)}>
            <Icon name="plus" size={16} /> Новая выдача
          </button>
          )}
        </div>
      </div>
      <div className={styles.container}>
        <div className="card">
          <div className="table-controls">
            <div className="search-box">
              <Icon name="search" size={16} className={styles.searchIcon} />
              <input
                type="text"
                name="search"
                placeholder="Поиск по сотруднику или наименованию..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="filter-field">
              <label>Сотрудник</label>
              <select value={filters.employee_id} onChange={(e) => setFilter('employee_id', e.target.value)}>
                <option value="">Все</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>{emp.full_name}</option>
                ))}
              </select>
            </div>
            <div className="filter-field">
              <label>Объект</label>
              <select value={filters.site_id} onChange={(e) => setFilter('site_id', e.target.value)}>
                <option value="">Все</option>
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
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
            <div className="filter-field">
              <label>Статус</label>
              <select value={filters.status} onChange={(e) => setFilter('status', e.target.value)}>
                <option value="">Все</option>
                <option value={ISSUE_STATUSES.issued}>{ISSUE_STATUS_LABELS.issued}</option>
                <option value={ISSUE_STATUSES.disposed}>{ISSUE_STATUS_LABELS.disposed}</option>
                <option value={ISSUE_STATUSES.returned}>{ISSUE_STATUS_LABELS.returned}</option>
                <option value={ISSUE_STATUSES.due_for_disposal}>{ISSUE_STATUS_LABELS.due_for_disposal}</option>
              </select>
            </div>
            <div className="filter-field">
              <label>Дата с</label>
              <input type="date" value={filters.date_from} onChange={(e) => setFilter('date_from', e.target.value)} />
            </div>
            <div className="filter-field">
              <label>Дата по</label>
              <input type="date" value={filters.date_to} onChange={(e) => setFilter('date_to', e.target.value)} />
            </div>
            {hasActiveFilters && (
              <button className="btn btn-secondary filter-reset" onClick={resetFilters}>
                Сбросить
              </button>
            )}
          </div>

          {loading && <LoadingState label="Загрузка выдач..." />}
          {!loading && error && <ErrorState message={error} onRetry={refetchRecords} />}
          {!loading && !error && (
            filteredRecords.length === 0 ? (
              <EmptyState
                icon={<Icon name="package" size={48} />}
                title="Выдач пока нет"
                description={hasActiveFilters ? 'По заданным фильтрам ничего не найдено.' : 'Зарегистрируйте первую выдачу спецодежды или СИЗ.'}
                action={isAdmin ? <button className="btn" onClick={() => setShowModal(true)}><Icon name="plus" size={16} /> Новая выдача</button> : null}
              />
            ) : (
              <>
                 <div className="tableScroll">
                 <table className="table">
                   <thead>
                    <tr>
                      <SortableTh label="Дата" sortKey="issue_date" sort={sort} onSort={toggleSort} />
                      <SortableTh label="Сотрудник" sortKey="full_name" sort={sort} onSort={toggleSort} />
                      <SortableTh label="Наименование" sortKey="item_type_name" sort={sort} onSort={toggleSort} />
                      <SortableTh label="Кол-во" sortKey="quantity" sort={sort} onSort={toggleSort} />
                      <SortableTh label="Срок годности" sortKey="expiry_date" sort={sort} onSort={toggleSort} />
                      <SortableTh label="Статус" sortKey="status" sort={sort} onSort={toggleSort} />
                      <th>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRecords.map((record) => (
                      <tr key={record.id}>
                        <td>{new Date(record.issue_date).toLocaleDateString()}</td>
                        <td>{record.full_name}</td>
                        <td>{record.item_type_name}</td>
                        <td>{record.quantity}</td>
                        <td>{record.expiry_date ? new Date(record.expiry_date).toLocaleDateString() : '-'}</td>
                         <td>
                           {record.status === ISSUE_STATUSES.issued ? (
                             <span className="badge badge-success">{ISSUE_STATUS_LABELS.issued}</span>
                           ) : record.status === ISSUE_STATUSES.disposed ? (
                             <span className="badge badge-danger">{ISSUE_STATUS_LABELS.disposed}</span>
                           ) : record.status === ISSUE_STATUSES.returned ? (
                             <span className="badge badge-info">{ISSUE_STATUS_LABELS.returned}</span>
                           ) : record.status === ISSUE_STATUSES.due_for_disposal ? (
                             <span className="badge badge-warning">{ISSUE_STATUS_LABELS.due_for_disposal}</span>
                           ) : (
                             <span className="badge">{record.status}</span>
                           )}
                         </td>
                        <td>
                            {(record.status === ISSUE_STATUSES.issued || record.status === ISSUE_STATUSES.due_for_disposal) && isAdmin && (
                              <div className="action-buttons">
                                <button className="btn" onClick={() => handleEdit(record)}><Icon name="pencil" size={14} /> Редактировать</button>
                                <button className="btn btn-danger" onClick={() => setDeleteId(record.id)}><Icon name="trash" size={14} /> Удалить</button>
                                <button className="btn btn-secondary" onClick={() => setDisposeId(record.id)}><Icon name="archiveX" size={14} /> Списать</button>
                              </div>
                            )}
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

      <Modal isOpen={showModal} onClose={handleClose} title={editingRecord && issueMode !== 'group' ? 'Редактировать выдачу' : 'Выдача спецодежды и СИЗ'}>
        <form onSubmit={editingRecord && issueMode !== 'group' ? handleUpdate : handleSubmit} className={styles.formSection}>
          <div className={styles.modeCards}>
            <label className={`${styles.modeCard} ${issueMode === 'single' ? styles.active : ''}`}>
              <input
                type="radio"
                name="issue_mode"
                value="single"
                checked={issueMode === 'single'}
                onChange={() => { setIssueMode('single'); setBatchItems([]); }}
              />
              <Icon name="user" size={22} className={styles.modeCardIcon} />
              <span className={styles.modeCardTitle}>Одиночная</span>
              <span className={styles.modeCardDesc}>Один сотрудник, одна позиция</span>
            </label>
            <label className={`${styles.modeCard} ${issueMode === 'group' ? styles.active : ''}`}>
              <input
                type="radio"
                name="issue_mode"
                value="group"
                checked={issueMode === 'group'}
                onChange={() => { setIssueMode('group'); setBatchItems([]); }}
              />
              <Icon name="users" size={22} className={styles.modeCardIcon} />
              <span className={styles.modeCardTitle}>Групповая</span>
              <span className={styles.modeCardDesc}>Всем сотрудникам объекта</span>
            </label>
            <label className={`${styles.modeCard} ${issueMode === 'batch-single' ? styles.active : ''}`}>
              <input
                type="radio"
                name="issue_mode"
                value="batch-single"
                checked={issueMode === 'batch-single'}
                onChange={() => { setIssueMode('batch-single'); setBatchItems([emptyBatchItem()]); }}
              />
              <Icon name="packageOpen" size={22} className={styles.modeCardIcon} />
              <span className={styles.modeCardTitle}>Несколько позиций</span>
              <span className={styles.modeCardDesc}>Сотруднику, много позиций</span>
            </label>
          </div>

          {editingRecord && issueMode === 'group' && (
            <div className={styles.warning}>
              Режим «Групповая выдача» создаст новую выдачу всем сотрудникам объекта на основе
              выбранного наименования и количества. Текущая запись не будет изменена.
            </div>
          )}

          <div className={styles.section}>
            <div className={styles.sectionTitle}>Контекст выдачи</div>
            <div className={styles.formGrid}>
              {issueMode === 'group' && (
                <div className={`form-group ${styles.field}`}>
                  <label>Объект *</label>
                  <select
                    className="form-control"
                    value={selectedSite}
                    onChange={(e) => handleSiteChange(e.target.value)}
                    required
                    aria-invalid={Boolean(fieldErrors.site_id)}
                    aria-describedby={fieldErrors.site_id ? 'site-error' : undefined}
                  >
                    <option value="">Выберите объект...</option>
                    {sites.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  {fieldErrors.site_id && <div id="site-error" className={styles.fieldError} role="alert">{fieldErrors.site_id}</div>}
                </div>
              )}
              {(issueMode === 'single' || issueMode === 'batch-single') && (
                <div className={`form-group ${styles.field}`}>
                  <label>Сотрудник *</label>
                  <select
                    className="form-control"
                    value={form.values.employee_id}
                    onChange={(e) => form.setMany({ employee_id: e.target.value })}
                    required
                    aria-invalid={Boolean(fieldErrors.employee_id)}
                    aria-describedby={fieldErrors.employee_id ? 'employee-error' : undefined}
                  >
                    <option value="">Выберите...</option>
                    {visibleEmployees.map((emp) => (
                      <option key={emp.id} value={emp.id}>{emp.full_name} ({emp.position})</option>
                    ))}
                  </select>
                  {fieldErrors.employee_id && <div id="employee-error" className={styles.fieldError} role="alert">{fieldErrors.employee_id}</div>}
                </div>
              )}
              {(issueMode === 'single' || issueMode === 'group') && (
                <div className={`form-group ${styles.field}`}>
                  <label>Наименование *</label>
                  <select
                    className="form-control"
                    value={form.values.item_type_id}
                    onChange={(e) => handleItemChange(e.target.value)}
                    required
                    aria-invalid={Boolean(fieldErrors.item_type_id)}
                    aria-describedby={fieldErrors.item_type_id ? 'item-type-error' : undefined}
                  >
                    <option value="">Выберите...</option>
                    {items.map((item) => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </select>
                  {fieldErrors.item_type_id && <div id="item-type-error" className={styles.fieldError} role="alert">{fieldErrors.item_type_id}</div>}
                </div>
              )}
            </div>
          </div>

          {issueMode !== 'batch-single' && (
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Параметры выдачи</div>
              <div className={styles.formGrid}>
                <div className={`form-group ${styles.field}`}>
                  <label>Способ выдачи</label>
                  <div className={styles.radioGroup}>
                    <label>
                      <input
                        type="radio"
                        name="issue_method"
                        value="personal"
                        checked={form.values.issue_method === 'personal'}
                        onChange={(e) => form.setMany({ issue_method: e.target.value })}
                      /> {ISSUE_METHODS.personal}
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="issue_method"
                        value="dosator"
                        checked={form.values.issue_method === 'dosator'}
                        onChange={(e) => form.setMany({ issue_method: e.target.value })}
                      /> {ISSUE_METHODS.dosator}
                    </label>
                  </div>
                </div>
                <div className={`form-group ${styles.field}`}>
                  <label>Количество</label>
                  <input
                    type="number"
                    className="form-control"
                    value={form.values.quantity}
                    onChange={(e) => form.setMany({ quantity: e.target.value })}
                    aria-invalid={Boolean(fieldErrors.quantity)}
                    aria-describedby={fieldErrors.quantity ? 'quantity-error' : undefined}
                  />
                  {fieldErrors.quantity && <div id="quantity-error" className={styles.fieldError} role="alert">{fieldErrors.quantity}</div>}
                </div>
                <div className={`form-group ${styles.field} ${styles.fullWidth}`}>
                  <label>Сертификат</label>
                  <select
                    className="form-control"
                    value={form.values.certificate_id}
                    onChange={(e) => form.setMany({ certificate_id: e.target.value })}
                    aria-invalid={Boolean(fieldErrors.certificate_id)}
                    aria-describedby={fieldErrors.certificate_id ? 'cert-error' : undefined}
                  >
                    <option value="">Без сертификата</option>
                    {certificates.map((cert) => (
                      <option key={cert.id} value={cert.id}>
                        {cert.certificate_number} (до {new Date(cert.expiry_date).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                  {fieldErrors.certificate_id && <div id="cert-error" className={styles.fieldError} role="alert">{fieldErrors.certificate_id}</div>}
                </div>
              </div>
            </div>
          )}

          {issueMode !== 'batch-single' && (
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Срок носки</div>
              <div className={styles.formGrid}>
                <div className={`form-group ${styles.field}`}>
                  <label>Срок носки (мес.) — оставьте пустым для значения по умолчанию</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Автоматически из нормы"
                    value={form.values.wear_time_override}
                    onChange={(e) => form.setMany({ wear_time_override: e.target.value })}
                    aria-invalid={Boolean(fieldErrors.wear_time_override)}
                    aria-describedby={fieldErrors.wear_time_override ? 'wear-error' : undefined}
                  />
                  {fieldErrors.wear_time_override && <div id="wear-error" className={styles.fieldError} role="alert">{fieldErrors.wear_time_override}</div>}
                </div>
              </div>
            </div>
          )}

          {issueMode === 'batch-single' && (
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Позиции выдачи</div>
              <table className={`table ${styles.batchTable}`} style={{ marginBottom: 8 }}>
                <thead>
                  <tr>
                    <th>Наименование</th>
                    <th>Кол-во</th>
                    <th>Сертификат</th>
                    <th>Способ выдачи</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {batchItems.map((bi, idx) => (
                    <tr key={idx}>
                      <td>
                        <select
                          className="form-control"
                          value={bi.item_type_id}
                          onChange={(e) => handleBatchItemChange(idx, e.target.value)}
                          aria-invalid={Boolean(fieldErrors[`items.${idx}.item_type_id`])}
                          aria-describedby={fieldErrors[`items.${idx}.item_type_id`] ? `batch-item-${idx}-error` : undefined}
                        >
                          <option value="">Выберите...</option>
                          {items.map((item) => (
                            <option key={item.id} value={item.id}>{item.name}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          type="number"
                          className="form-control"
                          value={bi.quantity}
                          onChange={(e) => updateBatchItem(idx, { quantity: e.target.value })}
                          aria-invalid={Boolean(fieldErrors[`items.${idx}.quantity`])}
                          aria-describedby={fieldErrors[`items.${idx}.quantity`] ? `batch-item-${idx}-error` : undefined}
                        />
                      </td>
                      <td>
                        <select
                          className="form-control"
                          value={bi.certificate_id}
                          onChange={(e) => updateBatchItem(idx, { certificate_id: e.target.value })}
                          aria-invalid={Boolean(fieldErrors[`items.${idx}.certificate_id`])}
                          aria-describedby={fieldErrors[`items.${idx}.certificate_id`] ? `batch-item-${idx}-error` : undefined}
                        >
                          <option value="">Без сертификата</option>
                          {certificates.map((cert) => (
                            <option key={cert.id} value={cert.id}>
                              {cert.certificate_number}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <select
                          className="form-control"
                          value={bi.issue_method}
                          onChange={(e) => updateBatchItem(idx, { issue_method: e.target.value })}
                          aria-invalid={Boolean(fieldErrors[`items.${idx}.issue_method`])}
                          aria-describedby={fieldErrors[`items.${idx}.issue_method`] ? `batch-item-${idx}-error` : undefined}
                        >
                          <option value="personal">{ISSUE_METHODS.personal}</option>
                          <option value="dosator">{ISSUE_METHODS.dosator}</option>
                        </select>
                      </td>
                      <td>
                        <button type="button" className="btn btn-danger" onClick={() => removeBatchItem(idx)}>×</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {batchItems.some((_, idx) => ['item_type_id', 'quantity', 'certificate_id', 'issue_method'].some(key => fieldErrors[`items.${idx}.${key}`])) && (
                <div className={styles.batchErrors}>
                  {batchItems.map((_, idx) =>
                    ['item_type_id', 'quantity', 'certificate_id', 'issue_method'].map(key => {
                      const errKey = `items.${idx}.${key}`;
                      if (fieldErrors[errKey]) {
                        return <div key={errKey} id={`batch-item-${idx}-error`} className={styles.fieldError} role="alert">{fieldErrors[errKey]}</div>;
                      }
                      return null;
                    })
                  ).flat()}
                </div>
              )}
              <button type="button" className="btn btn-secondary" onClick={addBatchItem}>+ Добавить позицию</button>
            </div>
          )}

          {!editingRecord && issueMode === 'single' && (
            <div className={`form-group ${styles.field}`}>
              <label>Подпись сотрудника (файл)</label>
              <input
                type="file"
                className="form-control"
                accept=".png,.jpg,.jpeg,.gif,.webp,.pdf"
                onChange={(e) => setSignatureFile(e.target.files[0] || null)}
              />
              {signatureFile && <small className={styles.signatureHint}>Выбран файл: {signatureFile.name}</small>}
            </div>
          )}

          <div className={styles.section}>
            <div className={styles.sectionTitle}>Дополнительно</div>
            <div className={styles.formGrid}>
              <div className={`form-group ${styles.field} ${styles.fullWidth}`}>
                <label>Примечание</label>
                <textarea
                  className="form-control"
                  value={form.values.notes}
                  onChange={(e) => form.setMany({ notes: e.target.value })}
                />
              </div>
              {lastSignature && editingRecord && (
                <div className={`form-group ${styles.field} ${styles.fullWidth}`}>
                  <div className={styles.signatureSuccess}>
                    <strong>Подпись загружена:</strong> <a href={lastSignature} target="_blank" rel="noreferrer">Открыть подпись</a>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className={styles.actions}>
            <button type="submit" className="btn" disabled={uploading}>
              {uploading
                ? 'Загрузка...'
                : (editingRecord
                  ? 'Сохранить'
                  : (issueMode === 'group'
                    ? `Выдать всем сотрудникам объекта (${selectedSite ? sites.find(s => s.id == selectedSite)?.name : 'объект не выбран'})`
                    : issueMode === 'batch-single'
                      ? 'Выдать все позиции сотруднику'
                      : 'Выдать'))}
            </button>
            {editingRecord && <button type="button" className="btn btn-secondary" onClick={handleClose}>Отмена</button>}
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(disposeId)}
        onClose={() => setDisposeId(null)}
        onConfirm={confirmDispose}
        title="Списание"
        message="Вы уверены, что хотите списать эту выдачу?"
      />

      <ConfirmDialog
        isOpen={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Удаление выдачи"
        message="Вы уверены, что хотите удалить эту запись о выдаче?"
      />
    </div>
  );
}
