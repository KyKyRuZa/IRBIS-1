import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { employeesService } from '@/lib/services/employees.service.js';
import { sitesService } from '@/lib/services/sites.service.js';
import { useAuth } from '@/hooks/useAuth.js';
import { useResource } from '@/hooks/useResource.js';
import { useTableControls, useFilteredList } from '@/hooks/useTableControls.js';
import { EMPLOYEE_STATUSES, EMPLOYEE_STATUS_VALUES, normalizeEmployeeStatus } from '@/lib/constants/employee-statuses.js';
import Modal from '@/components/ui/Modal.jsx';
import ConfirmDialog from '@/components/ui/ConfirmDialog.jsx';
import Pagination from '@/components/ui/Pagination.jsx';
import LoadingState from '@/components/ui/LoadingState.jsx';
import ErrorState from '@/components/ui/ErrorState.jsx';
import EmptyState from '@/components/ui/EmptyState.jsx';
import SortableTh from '@/components/ui/SortableTh.jsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers } from '@fortawesome/free-solid-svg-icons';
import styles from '@styles/EmployeeList.module.css';

export default function EmployeeList() {
  const { user } = useAuth();
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
    filters: { status: '', site_id: '' },
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
    if (editingEmployee) {
      await employeesService.update(editingEmployee.id, formData);
      setEditingEmployee(null);
    } else {
      await employeesService.create(formData);
    }
    setFormData({ full_name: '', position: '', site_id: '', gender: '', hire_date: '', clothing_size: '', shoe_size: '', personnel_number: '', hat_size: '', respirator_size: '', gloves_size: '', height: '', position_change_date: '' });
    setShowModal(false);
    refetchEmployees();
  };

  const handleEdit = (emp) => {
    setEditingEmployee(emp);
    setFormData({
      full_name: emp.full_name,
      position: emp.position,
      site_id: emp.site_id || '',
      gender: emp.gender || '',
      hire_date: emp.hire_date || '',
      clothing_size: emp.clothing_size || '',
      shoe_size: emp.shoe_size || '',
      personnel_number: emp.personnel_number || '',
      hat_size: emp.hat_size || '',
      respirator_size: emp.respirator_size || '',
      gloves_size: emp.gloves_size || '',
      height: emp.height || '',
      position_change_date: emp.position_change_date || ''
    });
    setShowModal(true);
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
  };

  const normalizedEmployees = useMemo(
    () => employees.map((e) => ({ ...e, status: normalizeEmployeeStatus(e.status) })),
    [employees]
  );

  const filteredEmployees = useFilteredList(normalizedEmployees, {
    search: searchApplied,
    filters,
    sort,
    searchFields: ['full_name', 'personnel_number', 'position', 'site_name']
  });

  const totalItems = filteredEmployees.length;
  const startIndex = (currentPage - 1) * 10;
  const paginatedEmployees = filteredEmployees.slice(startIndex, startIndex + 10);

  const hasActiveFilters = Boolean(search) || filters.status !== '' || filters.site_id !== '';

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.pageHeader}>
        <div className={`${styles.container} ${styles.pageHeaderContent}`}>
          <div className={styles.title}>
            <h1>Справочник сотрудников</h1>
            <div className={styles.subtitle}>Управление кадрами и персональными данными</div>
          </div>
          <button className="btn" onClick={() => setShowModal(true)}>
            Добавить сотрудника
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
                placeholder="Поиск по ФИО, табельному №, должности, объекту..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="filter-field">
              <label>Статус</label>
              <select value={filters.status} onChange={(e) => setFilter('status', e.target.value)}>
                <option value="">Все</option>
                <option value={EMPLOYEE_STATUS_VALUES.active}>Активные</option>
                <option value={EMPLOYEE_STATUS_VALUES.terminated}>Уволенные</option>
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
            {hasActiveFilters && (
              <button className="btn btn-secondary filter-reset" onClick={resetFilters}>
                Сбросить
              </button>
            )}
          </div>

          {loading && <LoadingState label="Загрузка сотрудников..." />}
          {!loading && error && <ErrorState message={error} onRetry={refetchEmployees} />}
          {!loading && !error && (
            filteredEmployees.length === 0 ? (
              <EmptyState
                icon={<FontAwesomeIcon icon={faUsers} />}
                title="Сотрудники не найдены"
                description={hasActiveFilters ? 'По заданным фильтрам ничего не найдено.' : 'В системе пока нет сотрудников. Добавьте первого.'}
                action={<button className="btn" onClick={() => setShowModal(true)}>Добавить сотрудника</button>}
              />
            ) : (
              <>
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
                    <tr key={emp.id}>
                      <td>{emp.full_name}</td>
                      <td>{emp.personnel_number || '-'}</td>
                      <td>{emp.position}</td>
                      <td>{emp.site_name || '-'}</td>
                      <td className=                        {emp.status === EMPLOYEE_STATUS_VALUES.active ? styles.statusActive : styles.statusTerminated}>
                        {emp.status === EMPLOYEE_STATUS_VALUES.active ? EMPLOYEE_STATUSES.active : EMPLOYEE_STATUSES.terminated}
                      </td>
                    <td>
                      <div className="action-buttons">
                        <Link to={`/employees/${emp.id}`} className="btn">
                          Карточка
                        </Link>
                        {emp.status === EMPLOYEE_STATUS_VALUES.active && (
                          <>
                            <button className="btn" onClick={() => handleEdit(emp)}>Редактировать</button>
                            <button className="btn btn-danger" onClick={() => setDeleteId(emp.id)}>Удалить</button>
                            <button className="btn btn-secondary" onClick={() => setTerminateId(emp.id)}>Уволить</button>
                          </>
                        )}
                      </div>
                    </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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

      <Modal isOpen={showModal} onClose={handleClose} title={editingEmployee ? 'Редактировать сотрудника' : 'Добавить сотрудника'}>
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
              />
            </div>
            <div className={`form-group ${styles.field}`}>
              <label>Должность *</label>
              <input
                type="text"
                className="form-control"
                value={formData.position}
                onChange={(e) => setFormData({...formData, position: e.target.value})}
                required
              />
            </div>
          </div>
          <div className={styles.formRow}>
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
          </div>
          <div className={styles.formRow}>
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
          <details className={styles.sizesGroup}>
            <summary>Размеры СИЗ (одежда, обувь, средства защиты)</summary>
            <div className={styles.formRow}>
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
            </div>
            <div className={styles.formRow}>
              <div className={`form-group ${styles.field}`}>
                <label>Рост</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.height}
                  onChange={(e) => setFormData({...formData, height: e.target.value})}
                />
              </div>
              <div className={`form-group ${styles.field}`}>
                <label>Размер головного убора</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.hat_size}
                  onChange={(e) => setFormData({...formData, hat_size: e.target.value})}
                />
              </div>
            </div>
            <div className={styles.formRow}>
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
          </details>

          <details className={styles.sizesGroup}>
            <summary>Даты (приём, изменение профессии)</summary>
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
          </details>
          <div className={styles.actionButtons}>
            <button type="submit" className="btn">{editingEmployee ? 'Сохранить' : 'Сохранить'}</button>
            {editingEmployee && <button type="button" className="btn btn-secondary" onClick={handleClose}>Отмена</button>}
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
