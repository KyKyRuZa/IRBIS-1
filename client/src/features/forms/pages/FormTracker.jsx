import { useState, useEffect } from 'react';
import { formsService } from '@lib/services/forms.service.js';
import { employeesService } from '@/lib/services/employees.service.js';
import Pagination from '@/components/ui/Pagination.jsx';
import styles from './FormTracker.module.css';

export default function FormTracker() {
  const [forms, setForms] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedForm, setSelectedForm] = useState('');
  const [records, setRecords] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchForms();
    fetchEmployees();
    fetchRecords();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [records]);

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
    fetchRecords();
  };

  const startIndex = (currentPage - 1) * 10;
  const paginatedRecords = records.slice(startIndex, startIndex + 10);

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
        <div className="card">
          <div className={styles.formsRow}>
            <form onSubmit={handleAddForm} className={styles.formSection}>
              <h3 className={styles.sectionTitle}>Добавить форму</h3>
              <div className={styles.formGrid}>
                <div className={`form-group ${styles.field}`}>
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
                <div className={`form-group ${styles.field}`}>
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
              <button type="submit" className="btn">Добавить форму</button>
            </form>

            <form onSubmit={handleTakeForm} className={styles.formSection}>
              <h3 className={styles.sectionTitle}>Отметить форму взятой</h3>
              <div className={styles.formGrid}>
                <div className={`form-group ${styles.field}`}>
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
                <div className={`form-group ${styles.field}`}>
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
              <button type="submit" className="btn">Отметить</button>
            </form>
          </div>
        </div>

        <div className="card">
          <h2 className={styles.sectionTitle}>История взятия форм</h2>
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Сотрудник (ФИО)</th>
                <th>Должность</th>
                <th>Форма</th>
                <th>Дата</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRecords.map((r) => (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td>{r.full_name}</td>
                  <td>{r.position}</td>
                  <td>{r.form_name}</td>
                  <td>{new Date(r.taken_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination
            totalItems={records.length}
            itemsPerPage={10}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    </div>
  );
}