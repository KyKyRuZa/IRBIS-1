import { useState, useEffect } from 'react';
import { employeesService } from '@/lib/services/employees.service.js';
import Pagination from '@/components/ui/Pagination.jsx';
import styles from './EmployeeRegistration.module.css';

export default function EmployeeRegistration() {
  const [employees, setEmployees] = useState([]);
  const [fullName, setFullName] = useState('');
  const [position, setPosition] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    employeesService.list().then(setEmployees);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [employees]);

  useEffect(() => {
    employeesService.list().then(setEmployees);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName || !position) return;
    await employeesService.create({ full_name: fullName, position });
    setFullName('');
    setPosition('');
    employeesService.list().then(setEmployees);
  };

  const startIndex = (currentPage - 1) * 10;
  const paginatedEmployees = employees.slice(startIndex, startIndex + 10);

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.pageHeader}>
        <div className={`${styles.container} ${styles.pageHeaderContent}`}>
          <div className={styles.title}>
            <h1>Регистрация сотрудников</h1>
            <div className={styles.subtitle}>Упрощённый ввод новых кадров</div>
          </div>
        </div>
      </div>
      <div className={styles.container}>
        <div className="card">
          <form onSubmit={handleSubmit} className={styles.formSection}>
            <div className={styles.formGrid}>
              <div className={`form-group ${styles.field}`}>
                <label>ФИО *</label>
                <input
                  type="text"
                  className="form-control"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
              <div className={`form-group ${styles.field}`}>
                <label>Должность *</label>
                <input
                  type="text"
                  className="form-control"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  required
                />
              </div>
            </div>
            <button type="submit" className="btn">Зарегистрировать</button>
          </form>

          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>ФИО</th>
                <th>Должность</th>
                <th>Дата регистрации</th>
              </tr>
            </thead>
            <tbody>
              {paginatedEmployees.map((emp) => (
                <tr key={emp.id}>
                  <td>{emp.id}</td>
                  <td>{emp.full_name}</td>
                  <td>{emp.position}</td>
                  <td>{new Date(emp.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination
            totalItems={employees.length}
            itemsPerPage={10}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    </div>
  );
}
