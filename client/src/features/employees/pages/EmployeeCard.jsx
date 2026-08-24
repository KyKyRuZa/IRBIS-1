import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { employeesService } from '@/lib/services/employees.service.js';
import { EMPLOYEE_STATUSES } from '@/lib/constants/employee-statuses.js';
import { ISSUE_STATUSES, ISSUE_STATUS_LABELS } from '@/lib/constants/issue-statuses.js';
import StatusBadge from '@/components/ui/StatusBadge.jsx';
import styles from './EmployeeCard.module.css';

export default function EmployeeCard() {
  const { id } = useParams();
  const [employee, setEmployee] = useState(null);

  useEffect(() => {
    employeesService.get(id).then(setEmployee);
  }, [id]);

  if (!employee) return <div className="card">Загрузка...</div>;

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.pageHeader}>
        <div className={`container ${styles.pageHeaderContent}`}>
          <div className={styles.title}>
            <h1>Личная карточка сотрудника</h1>
            <div className={styles.subtitle}>Данные, нормы и история выдач</div>
          </div>
        </div>
      </div>
      <div className="container">
        {!employee ? (
          <div className="card">Загрузка...</div>
        ) : (
          <>
            <div className="card">
              <h2 className={styles.employeeName}>{employee.full_name}</h2>
              <p><strong>Табельный номер:</strong> {employee.personnel_number || '-'}</p>
              <p><strong>Должность:</strong> {employee.position}</p>
              <p><strong>Объект:</strong> {employee.site_name || '-'}</p>
              <p><strong>Дата приёма:</strong> {employee.hire_date}</p>
              <p><strong>Дата изменения профессии/подразделения:</strong> {employee.position_change_date || '-'}</p>
              <p><strong>Пол:</strong> {employee.gender === 'male' ? 'Мужской' : employee.gender === 'female' ? 'Женский' : employee.gender || '-'}</p>
              <p><strong>Рост:</strong> {employee.height || '-'} см</p>
              <p><strong>Размер одежды:</strong> {employee.clothing_size || '-'}</p>
              <p><strong>Размер обуви:</strong> {employee.shoe_size || '-'}</p>
              <p><strong>Размер головного убора:</strong> {employee.hat_size || '-'}</p>
              <p><strong>Размер СИЗОД:</strong> {employee.respirator_size || '-'}</p>
              <p><strong>Размер СИЗ рук:</strong> {employee.gloves_size || '-'}</p>
              <p><strong>Статус:</strong> {employee.status === EMPLOYEE_STATUSES.active ? EMPLOYEE_STATUSES.active : EMPLOYEE_STATUSES.terminated}</p>
            </div>

            <div className="card">
              <h3 className={styles.sectionTitle}>Экспорт документов</h3>
              <div className={styles.exportActions}>
                <button className="btn" onClick={() => window.open(`/api/export/employee-card/${employee.id}`, '_blank')}>Личная карточка СИЗ (Word)</button>
                <button className="btn btn-secondary" onClick={() => window.open(`/api/export/consumables/${employee.id}?period=first`, '_blank')}>Ведомость расходников I полугодие</button>
                <button className="btn btn-secondary" onClick={() => window.open(`/api/export/consumables/${employee.id}?period=second`, '_blank')}>Ведомость расходников II полугодие</button>
              </div>
            </div>

            <div className="card">
              <h3 className={styles.sectionTitle}>Нормы выдачи</h3>
              <table className="table">
                <thead>
                  <tr>
                    <th>Наименование</th>
                    <th>Периодичность</th>
                    <th>Кол-во</th>
                  </tr>
                </thead>
                <tbody>
                  {employee.norms?.map((norm) => (
                    <tr key={norm.id}>
                      <td>{norm.item_type_name}</td>
                      <td>{norm.period_months} мес</td>
                      <td>{norm.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="card">
              <h3 className={styles.sectionTitle}>История выдач</h3>
              <table className="table">
                <thead>
                  <tr>
                    <th>Дата</th>
                    <th>Наименование</th>
                    <th>Кол-во</th>
                    <th>Срок годности</th>
                    <th>Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {employee.history?.map((record) => (
                    <tr key={record.id}>
                      <td>{new Date(record.issue_date).toLocaleDateString()}</td>
                      <td>{record.item_type_name}</td>
                      <td>{record.quantity}</td>
                      <td>{record.expiry_date ? new Date(record.expiry_date).toLocaleDateString() : '-'}</td>
                       <td>
                        {record.status === ISSUE_STATUSES.issued ? (
                          <StatusBadge status={ISSUE_STATUSES.issued} />
                        ) : record.status === ISSUE_STATUSES.disposed ? (
                          <StatusBadge status={ISSUE_STATUSES.disposed} />
                        ) : record.status === ISSUE_STATUSES.returned ? (
                          <StatusBadge status={ISSUE_STATUSES.returned} />
                        ) : (
                          <span className="badge">{record.status}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
