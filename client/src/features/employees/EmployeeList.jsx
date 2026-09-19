import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { employeesService } from '@/lib/services/employees.service.js';
import { sitesService } from '@/lib/services/sites.service.js';
import { useAuth } from '@/hooks/useAuth.js';
import { toDateInput } from '@/lib/utils/date.js';
import { useResource } from '@/hooks/useResource.js';
import { useTableControls } from '@/hooks/useTableControls.js';
import { EMPLOYEE_STATUSES, EMPLOYEE_STATUS_VALUES, normalizeEmployeeStatus } from '@/lib/constants/employee-statuses.js';
import { showError, showSuccess, showFieldErrors } from '@/lib/toast.js';
import { employeeSchema } from '@/lib/validation/forms.js';
import Modal from '@components/ui/Modal.jsx';
import ConfirmDialog from '@components/ui/ConfirmDialog.jsx';
import Pagination from '@components/ui/Pagination.jsx';
import LoadingState from '@components/ui/LoadingState.jsx';
import ErrorState from '@components/ui/ErrorState.jsx';
import EmptyState from '@components/ui/EmptyState.jsx';
import SortableTh from '@components/ui/SortableTh.jsx';
import Icon from '@components/ui/Icon.jsx';
import SearchBox from '@components/ui/SearchBox.jsx';
import FilterSelect from '@components/ui/FilterSelect.jsx';
import DateRange from '@components/ui/DateRange.jsx';
import styles from '@styles/EmployeeList.module.css';

export default function EmployeeList() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    position: '',
    site_id: '',
    gender: '',
    hire_date: '',
    clothing_size: '',
    shoe_size: '',
    personnel_number: '',
    hat_size: '',
    respirator_size: '',
    gloves_size: '',
    height: '',
    position_change_date: ''
  });
  const [sites, setSites] = useState([]);
  const [terminateId, setTerminateId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [fieldErrors, setFieldErrors] = useState({});

  const { data: employees, loading, error, refetch: refetchEmployees } = useResource(
    useCallback(() => employeesService.list(), [])
  );

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
    filters: { status: '', site_id: '', gender: '', hire_date_from: '', hire_date_to: '' },
    sort: { key: 'full_name', dir: 'asc' }
  });

  useEffect(() => {
    sitesService.list().then(setSites);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchApplied, filters, employees]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});
    const result = employeeSchema.safeParse(formData);
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
      if (editingEmployee) {
        await employeesService.update(editingEmployee.id, result.data);
        setEditingEmployee(null);
        showSuccess('Данные сотрудника обновлены');
      } else {
        await employeesService.create(result.data);
        showSuccess('Сотрудник добавлен');
      }
      setFormData({ full_name: '', position: '', site_id: '', gender: '', hire_date: '', clothing_size: '', shoe_size: '', personnel_number: '', hat_size: '', respirator_size: '', gloves_size: '', height: '', position_change_date: '' });
      setShowModal(false);
      refetchEmployees();
    } catch (err) {
      showError(err.response?.data?.error || 'Не удалось сохранить сотрудника');
    }
  };

  const handleEdit = (emp) => {
    setEditingEmployee(emp);
    setFormData({
      full_name: emp.full_name,
      position: emp.position,
      site_id: emp.site_id || '',
      gender: emp.gender || '',
      hire_date: toDateInput(emp.hire_date),
      clothing_size: emp.clothing_size || '',
      shoe_size: emp.shoe_size || '',
      personnel_number: emp.personnel_number || '',
      hat_size: emp.hat_size || '',
      respirator_size: emp.respirator_size || '',
      gloves_size: emp.gloves_size || '',
      height: emp.height || '',
      position_change_date: toDateInput(emp.position_change_date)
    });
    setShowModal(true);
  };

  const handleRowClick = (emp) => {
    navigate(`/employees/${emp.id}`);
  };

  const confirmTerminate = async () => {
    if (!terminateId) return;
    await employeesService.terminate(terminateId);
    refetchEmployees();
    setTerminateId(null);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    await employeesService.delete(deleteId);
    refetchEmployees();
    setDeleteId(null);
  };

  const handleClose = () => {
    setShowModal(false);
    setEditingEmployee(null);
    setFormData({ full_name: '', position: '', site_id: '', gender: '', hire_date: '', clothing_size: '', shoe_size: '', personnel_number: '', hat_size: '', respirator_size: '', gloves_size: '', height: '', position_change_date: '' });
    setFieldErrors({});
  };

  const normalizedEmployees = useMemo(
    () => employees.map((e) => ({ ...e, status: normalizeEmployeeStatus(e.status) })),
    [employees]
  );

  const filteredEmployees = useMemo(() => {
    let result = normalizedEmployees;
    const searchFields = ['full_name', 'personnel_number', 'position', 'site_name'];

    const query = searchApplied.trim().toLowerCase();
    if (query) {
      result = result.filter((emp) =>
        searchFields.some((field) => {
          const value = emp[field];
          return value != null && String(value).toLowerCase().includes(query);
        })
      );
    }

    if (filters.status) {
      result = result.filter((emp) => emp.status === filters.status);
    }
    if (filters.site_id) {
      result = result.filter((emp) => emp.site_id === Number(filters.site_id));
    }
    if (filters.gender) {
      result = result.filter((emp) => emp.gender === filters.gender);
    }
    const hireFrom = filters.hire_date_from;
    const hireTo = filters.hire_date_to;
    if (hireFrom || hireTo) {
      result = result.filter((emp) => {
        if (!emp.hire_date) return false;
        if (hireFrom && emp.hire_date < hireFrom) return false;
        if (hireTo && emp.hire_date > hireTo) return false;
        return true;
      });
    }

    if (sort && sort.key) {
      const { key, dir } = sort;
      result = [...result].sort((a, b) => {
        const cmp = String(a[key] || '').localeCompare(String(b[key] || ''), 'ru');
        return dir === 'desc' ? -cmp : cmp;
      });
    }

    return result;
  }, [normalizedEmployees, searchApplied, filters, sort]);

  const totalItems = filteredEmployees.length;
  const startIndex = (currentPage - 1) * 10;
  const paginatedEmployees = filteredEmployees.slice(startIndex, startIndex + 10);

  const hasActiveFilters = Boolean(search) || filters.status !== '' || filters.site_id !== '' || Boolean(filters.gender) || Boolean(filters.hire_date_from) || Boolean(filters.hire_date_to);

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.pageHeader}>
        <div className={`${styles.container} ${styles.pageHeaderContent}`}>
          <div className={styles.title}>
            <h1>Справочник сотрудников</h1>
            <div className={styles.subtitle}>Управление кадрами и персональными данными</div>
          </div>
          {isAdmin && (
          <button className="btn" onClick={() => setShowModal(true)}>
            <Icon name="userPlus" size={16} /> Добавить сотрудника
          </button>
          )}
        </div>
      </div>
      <div className={styles.container}>
        <div className="card">
          <div className="table-controls">
            <SearchBox
              value={search}
              onChange={setSearch}
              placeholder="Поиск по ФИО, табельному №, должности, объекту..."
            />
            <FilterSelect label="Статус" value={filters.status} onChange={(value) => setFilter('status', value)}>
              <option value="">Все</option>
              <option value={EMPLOYEE_STATUS_VALUES.active}>Активные</option>
              <option value={EMPLOYEE_STATUS_VALUES.terminated}>Уволенные</option>
            </FilterSelect>
            <FilterSelect label="Объект" value={filters.site_id} onChange={(value) => setFilter('site_id', value)}>
              <option value="">Все</option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </FilterSelect>
            <FilterSelect label="Пол" value={filters.gender} onChange={(value) => setFilter('gender', value)}>
              <option value="">Все</option>
              <option value="male">Мужской</option>
              <option value="female">Женский</option>
            </FilterSelect>
            <DateRange
              from={filters.hire_date_from}
              to={filters.hire_date_to}
              onFromChange={(value) => setFilter('hire_date_from', value)}
              onToChange={(value) => setFilter('hire_date_to', value)}
              fromLabel="Дата приёма с"
              toLabel="Дата приёма по"
            />
            {hasActiveFilters && (
              <button className="btn btn-secondary filter-reset" onClick={resetFilters}>
                <Icon name="rotateCcw" size={16} /> Сбросить
              </button>
            )}
          </div>

          {loading && <LoadingState label="Загрузка сотрудников..." />}
          {!loading && error && <ErrorState message={error} onRetry={refetchEmployees} />}
          {!loading && !error && (
            filteredEmployees.length === 0 ? (
              <EmptyState
                icon={<Icon name="users" size={48} />}
                title="Сотрудники не найдены"
                description={hasActiveFilters ? 'По заданным фильтрам ничего не найдено.' : 'В системе пока нет сотрудников. Добавьте первого.'}
                action={<button className="btn" onClick={() => setShowModal(true)}><Icon name="userPlus" size={16} /> Добавить сотрудника</button>}
              />
            ) : (
              <>
                 <div className="tableScroll">
                 <table className="table">
                <thead>
                  <tr>
                    <SortableTh label="ФИО" sortKey="full_name" sort={sort} onSort={toggleSort} />
                    <SortableTh label="Табельный №" sortKey="personnel_number" sort={sort} onSort={toggleSort} />
                    <SortableTh label="Должность" sortKey="position" sort={sort} onSort={toggleSort} />
                    <SortableTh label="Объект" sortKey="site_name" sort={sort} onSort={toggleSort} />
                    <SortableTh label="Статус" sortKey="status" sort={sort} onSort={toggleSort} />
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedEmployees.map((emp) => (
                    <tr key={emp.id} onClick={() => handleRowClick(emp)} className={styles.clickableRow}>
                      <td>{emp.full_name}</td>
                      <td>{emp.personnel_number || '-'}</td>
                      <td>{emp.position}</td>
                      <td>{emp.site_name || '-'}</td>
                      <td>
                        {emp.status === EMPLOYEE_STATUS_VALUES.active ? (
                          <span className={styles.statusBadgeActive}>{EMPLOYEE_STATUSES.active}</span>
                        ) : (
                          <span className={styles.statusBadgeTerminated}>{EMPLOYEE_STATUSES.terminated}</span>
                        )}
                      </td>
                    <td>
                        <div className="action-buttons">
                          {emp.status === EMPLOYEE_STATUS_VALUES.active && (
                            <>
                        {isAdmin && (
                          <>
                            <button className="btn action-btn" aria-label="Редактировать" data-tooltip="Редактировать" onClick={(e) => { e.stopPropagation(); handleEdit(emp); }}><Icon name="pencil" size={14} /></button>
                            <button className="btn btn-danger action-btn" aria-label="Удалить" data-tooltip="Удалить" onClick={(e) => { e.stopPropagation(); setDeleteId(emp.id); }}><Icon name="trash" size={14} /></button>
                            <button className="btn btn-secondary action-btn" aria-label="Уволить" data-tooltip="Уволить" onClick={(e) => { e.stopPropagation(); setTerminateId(emp.id); }}><Icon name="userMinus" size={14} /></button>
                          </>
                        )}
                          </>
                          )}
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

      <Modal isOpen={showModal} onClose={handleClose} title={editingEmployee ? 'Редактировать сотрудника' : 'Новый сотрудник'}>
        <form onSubmit={handleSubmit} className={styles.formSection}>
          <div className={styles.formRow}>
            <div className={`form-group ${styles.field}`}>
              <label>ФИО *</label>
              <input
                type="text"
                className="form-control"
                value={formData.full_name}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                required
                aria-invalid={Boolean(fieldErrors.full_name)}
                aria-describedby={fieldErrors.full_name ? 'fullname-error' : undefined}
              />
              {fieldErrors.full_name && <div id="fullname-error" className={styles.fieldError} role="alert">{fieldErrors.full_name}</div>}
            </div>
            <div className={`form-group ${styles.field}`}>
              <label>Должность *</label>
              <input
                type="text"
                className="form-control"
                value={formData.position}
                onChange={(e) => setFormData({...formData, position: e.target.value})}
                required
                aria-invalid={Boolean(fieldErrors.position)}
                aria-describedby={fieldErrors.position ? 'position-error' : undefined}
              />
              {fieldErrors.position && <div id="position-error" className={styles.fieldError} role="alert">{fieldErrors.position}</div>}
            </div>
          </div>
          <div className={`${styles.formRow} ${styles['formRow--three']}`}>
            <div className={`form-group ${styles.field}`}>
              <label>Пол</label>
              <select
                className="form-control"
                value={formData.gender}
                onChange={(e) => setFormData({...formData, gender: e.target.value})}
              >
                <option value="">Выберите пол</option>
                <option value="male">Мужской</option>
                <option value="female">Женский</option>
              </select>
            </div>
            <div className={`form-group ${styles.field}`}>
              <label>Табельный номер</label>
              <input
                type="text"
                className="form-control"
                value={formData.personnel_number}
                onChange={(e) => setFormData({...formData, personnel_number: e.target.value})}
              />
            </div>
            <div className={`form-group ${styles.field}`}>
              <label>Объект</label>
              <select
                className="form-control"
                value={formData.site_id}
                onChange={(e) => setFormData({...formData, site_id: e.target.value})}
              >
                <option value="">Выберите объект</option>
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.sectionLabel}>СИЗ</div>
          <div className={`${styles.formRow} ${styles['formRow--three']}`}>
            <div className={`form-group ${styles.field}`}>
              <label>Размер одежды</label>
              <input
                type="text"
                className="form-control"
                value={formData.clothing_size}
                onChange={(e) => setFormData({...formData, clothing_size: e.target.value})}
              />
            </div>
            <div className={`form-group ${styles.field}`}>
              <label>Размер обуви</label>
              <input
                type="text"
                className="form-control"
                value={formData.shoe_size}
                onChange={(e) => setFormData({...formData, shoe_size: e.target.value})}
              />
            </div>
            <div className={`form-group ${styles.field}`}>
              <label>Рост</label>
              <input
                type="number"
                className="form-control"
                value={formData.height}
                onChange={(e) => setFormData({...formData, height: e.target.value})}
              />
            </div>
          </div>
          <div className={`${styles.formRow} ${styles['formRow--three']}`}>
            <div className={`form-group ${styles.field}`}>
              <label>Размер головного убора</label>
              <input
                type="text"
                className="form-control"
                value={formData.hat_size}
                onChange={(e) => setFormData({...formData, hat_size: e.target.value})}
              />
            </div>
            <div className={`form-group ${styles.field}`}>
              <label>Размер СИЗОД (дыхания)</label>
              <input
                type="text"
                className="form-control"
                value={formData.respirator_size}
                onChange={(e) => setFormData({...formData, respirator_size: e.target.value})}
              />
            </div>
            <div className={`form-group ${styles.field}`}>
              <label>Размер СИЗ рук</label>
              <input
                type="text"
                className="form-control"
                value={formData.gloves_size}
                onChange={(e) => setFormData({...formData, gloves_size: e.target.value})}
              />
            </div>
          </div>

          <div className={styles.sectionLabel}>Даты</div>
          <div className={styles.formRow}>
            <div className={`form-group ${styles.field}`}>
              <label>Дата приёма</label>
              <input
                type="date"
                className="form-control"
                value={formData.hire_date}
                onChange={(e) => setFormData({...formData, hire_date: e.target.value})}
              />
            </div>
            <div className={`form-group ${styles.field}`}>
              <label>Дата изменения профессии/подразделения</label>
              <input
                type="date"
                className="form-control"
                value={formData.position_change_date}
                onChange={(e) => setFormData({...formData, position_change_date: e.target.value})}
              />
            </div>
          </div>

          <div className={styles.actionButtons}>
            <button type="submit" className="btn">{editingEmployee ? 'Сохранить' : 'Создать сотрудника'}</button>
            {editingEmployee && (
              <button type="button" className="btn btn-secondary" onClick={handleClose}>Отмена</button>
            )}
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(terminateId)}
        onClose={() => setTerminateId(null)}
        onConfirm={confirmTerminate}
        title="Увольнение сотрудника"
        message="Вы уверены, что хотите уволить этого сотрудника?"
      />

      <ConfirmDialog
        isOpen={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Удаление сотрудника"
        message="Вы уверены, что хотите безвозвратно удалить этого сотрудника?"
      />
    </div>
  );
}
