import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { employeesService } from '@/lib/services/employees.service.js';
import { sitesService } from '@/lib/services/sites.service.js';
import { useAuth } from '@/hooks/useAuth.js';
import { useResource } from '@/hooks/useResource.js';
import { EMPLOYEE_STATUSES } from '@/lib/constants/employee-statuses.js';
import Modal from '@/components/ui/Modal.jsx';
import ConfirmDialog from '@/components/ui/ConfirmDialog.jsx';
import Pagination from '@/components/ui/Pagination.jsx';
import styles from './EmployeeList.module.css';

export default function EmployeeList() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
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
    useCallback(() => employeesService.list({ search }), [search])
  );

  useEffect(() => {
    sitesService.list().then(setSites);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, employees]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(e.target.elements.search.value);
  };

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

  const totalItems = employees?.length || 0;
  const startIndex = (currentPage - 1) * 10;
  const paginatedEmployees = employees?.slice(startIndex, startIndex + 10) || [];

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.pageHeader}>
        <div className={`container ${styles.pageHeaderContent}`}>
          <div className={styles.title}>
            <h1>Справочник сотрудников</h1>
            <div className={styles.subtitle}>Управление кадрами и персональными данными</div>
          </div>
          <button className="btn" onClick={() => setShowModal(true)}>
            Добавить сотрудника
          </button>
        </div>
      </div>
      <div className="container">
        <div className="card">
          <form className="search-box" onSubmit={handleSearch}>
            <input
              type="text"
              name="search"
              placeholder="Поиск по ФИО..."
              defaultValue={search}
            />
            <button type="submit" className="btn">Найти</button>
          </form>
        </div>

        <div className="card">
          {loading && <div className="card">Загрузка...</div>}
          {error && <div className={`card ${styles.error}`}>{error}</div>}
          {!loading && !error && (
            <>
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>ФИО</th>
                    <th>Табельный №</th>
                    <th>Должность</th>
                    <th>Объект</th>
                    <th>Размеры</th>
                    <th>Статус</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedEmployees.map((emp) => (
                    <tr key={emp.id}>
                      <td>{emp.id}</td>
                      <td>{emp.full_name}</td>
                      <td>{emp.personnel_number || '-'}</td>
                      <td>{emp.position}</td>
                      <td>{emp.site_name || '-'}</td>
                      <td>{emp.clothing_size} / {emp.shoe_size} / {emp.hat_size || '-'} / {emp.respirator_size || '-'} / {emp.gloves_size || '-'}</td>
                      <td className={emp.status === EMPLOYEE_STATUSES.active ? styles.statusActive : styles.statusTerminated}>
                        {emp.status === EMPLOYEE_STATUSES.active ? EMPLOYEE_STATUSES.active : EMPLOYEE_STATUSES.terminated}
                      </td>
                    <td>
                      <div className="action-buttons">
                        <Link to={`/employees/${emp.id}`} className="btn">
                          Карточка
                        </Link>
                        {emp.status === EMPLOYEE_STATUSES.active && (
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
              <label>Табельный номер</label>
              <input
                type="text"
                className="form-control"
                value={formData.personnel_number}
                onChange={(e) => setFormData({...formData, personnel_number: e.target.value})}
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
