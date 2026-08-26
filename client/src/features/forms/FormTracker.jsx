import { useState, useEffect, useRef, useMemo } from 'react';
import { formsService } from '@lib/services/forms.service.js';
import { employeesService } from '@/lib/services/employees.service.js';
import { useTableControls, useFilteredList } from '@/hooks/useTableControls.js';
import Pagination from '@/components/ui/Pagination.jsx';
import EmptyState from '@/components/ui/EmptyState.jsx';
import SortableTh from '@/components/ui/SortableTh.jsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare } from '@fortawesome/free-solid-svg-icons';
import styles from '@styles/FormTracker.module.css';

export default function FormTracker() {
  const [forms, setForms] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [records, setRecords] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showTakeModal, setShowTakeModal] = useState(false);

  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedForm, setSelectedForm] = useState('');

  const addModalRef = useRef(null);
  const takeModalRef = useRef(null);

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
    filters: { date_from: '', date_to: '' },
    sort: { key: 'taken_at', dir: 'desc' }
  });

  useEffect(() => {
    fetchForms();
    fetchEmployees();
    fetchRecords();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchApplied, filters, sort, records]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (addModalRef.current && !addModalRef.current.contains(e.target)) {
        setShowAddModal(false);
      }
      if (takeModalRef.current && !takeModalRef.current.contains(e.target)) {
        setShowTakeModal(false);
      }
    };
    if (showAddModal || showTakeModal) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showAddModal, showTakeModal]);

  const fetchForms = async () => {
    const res = await formsService.list();
    setForms(res);
  };

  const fetchEmployees = async () => {
    const res = await employeesService.list();
    setEmployees(res);
  };

  const fetchRecords = async () => {
    const res = await formsService.listTaken();
    setRecords(res);
  };

  const handleAddForm = async (e) => {
    e.preventDefault();
    if (!formName) return;
    await formsService.create({ name: formName, description: formDesc });
    setFormName('');
    setFormDesc('');
    setShowAddModal(false);
    fetchForms();
  };

  const handleTakeForm = async (e) => {
    e.preventDefault();
    if (!selectedEmployee || !selectedForm) return;
    await formsService.take({
      employee_id: selectedEmployee,
      form_id: selectedForm
    });
    setSelectedEmployee('');
    setSelectedForm('');
    setShowTakeModal(false);
    fetchRecords();
  };

  const dateFilteredRecords = useMemo(() => records.filter((r) => {
    const rDate = (r.taken_at || '').slice(0, 10);
    if (filters.date_from && rDate && rDate < filters.date_from) return false;
    if (filters.date_to && rDate && rDate > filters.date_to) return false;
    return true;
  }), [records, filters.date_from, filters.date_to]);

  const filteredRecords = useFilteredList(dateFilteredRecords, {
    search: searchApplied,
    filters: {},
    sort,
    searchFields: ['full_name', 'position', 'form_name']
  });

  const totalItems = filteredRecords.length;
  const startIndex = (currentPage - 1) * 10;
  const paginatedRecords = filteredRecords.slice(startIndex, startIndex + 10);

  const hasActiveFilters = Boolean(search) || filters.date_from !== '' || filters.date_to !== '';

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.pageHeader}>
        <div className={`${styles.container} ${styles.pageHeaderContent}`}>
          <div className={styles.title}>
            <h1>Учёт форм</h1>
            <div className={styles.subtitle}>Административная панель учёта бланков и документов</div>
          </div>
        </div>
      </div>
      <div className={styles.content}>
        <div className={styles.toolbar}>
          <button className="btn" onClick={() => setShowAddModal(true)}>+ Добавить форму</button>
          <button className="btn btn-secondary" onClick={() => setShowTakeModal(true)}>Отметить форму взятой</button>
        </div>

        <div className="card">
          <h2 className={styles.sectionTitle}>История взятия форм</h2>
          <div className="table-controls">
            <div className="search-box">
              <input
                type="text"
                name="search"
                placeholder="Поиск по сотруднику, должности или форме..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
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
          {filteredRecords.length === 0 ? (
            <EmptyState icon={<FontAwesomeIcon icon={faPenToSquare} />} title="Нет записей" description={hasActiveFilters ? 'По заданным фильтрам ничего не найдено.' : 'Формы ещё не отмечались как взятые.'} />
          ) : (
            <>
              <table className="table">
                <thead>
                  <tr>
                    <SortableTh label="Сотрудник (ФИО)" sortKey="full_name" sort={sort} onSort={toggleSort} />
                    <SortableTh label="Должность" sortKey="position" sort={sort} onSort={toggleSort} />
                    <SortableTh label="Форма" sortKey="form_name" sort={sort} onSort={toggleSort} />
                    <SortableTh label="Дата" sortKey="taken_at" sort={sort} onSort={toggleSort} />
                  </tr>
                </thead>
                <tbody>
                  {paginatedRecords.map((r) => (
                    <tr key={r.id}>
                      <td>{r.full_name}</td>
                      <td>{r.position}</td>
                      <td>{r.form_name}</td>
                      <td>{new Date(r.taken_at).toLocaleString()}</td>
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
          )}
        </div>
      </div>

      {showAddModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal} ref={addModalRef}>
            <div className={styles.modalHeader}>
              <h3>Добавить форму</h3>
              <button className={styles.modalClose} onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <form onSubmit={handleAddForm}>
              <div className={styles.modalBody}>
                <div className="form-group">
                  <label>Название формы</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Название формы"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Описание</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Описание"
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                  />
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Отмена</button>
                <button type="submit" className="btn">Добавить</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTakeModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal} ref={takeModalRef}>
            <div className={styles.modalHeader}>
              <h3>Отметить форму взятой</h3>
              <button className={styles.modalClose} onClick={() => setShowTakeModal(false)}>×</button>
            </div>
            <form onSubmit={handleTakeForm}>
              <div className={styles.modalBody}>
                <div className="form-group">
                  <label>Сотрудник</label>
                  <select
                    className="form-control"
                    value={selectedEmployee}
                    onChange={(e) => setSelectedEmployee(e.target.value)}
                    required
                  >
                    <option value="">Выберите сотрудника</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.full_name} ({emp.position})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Форма</label>
                  <select
                    className="form-control"
                    value={selectedForm}
                    onChange={(e) => setSelectedForm(e.target.value)}
                    required
                  >
                    <option value="">Выберите форму</option>
                    {forms.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowTakeModal(false)}>Отмена</button>
                <button type="submit" className="btn">Отметить</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
