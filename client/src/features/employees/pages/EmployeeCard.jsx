import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { employeesService } from '@/lib/services/employees.service.js';
import { EMPLOYEE_STATUSES } from '@/lib/constants/employee-statuses.js';
import { ISSUE_STATUSES, ISSUE_STATUS_LABELS } from '@/lib/constants/issue-statuses.js';
import StatusBadge from '@/components/ui/StatusBadge.jsx';
import Pagination from '@/components/ui/Pagination.jsx';
import LoadingState from '@/components/ui/LoadingState.jsx';
import EmptyState from '@/components/ui/EmptyState.jsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClipboardList, faBox } from '@fortawesome/free-solid-svg-icons';
import { exportsService } from '@/lib/services/exports.service.js';
import { useExport } from '@hooks/useExport.js';
import styles from './EmployeeCard.module.css';

export default function EmployeeCard() {
  const { id } = useParams();
  const [employee, setEmployee] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentPageNorms, setCurrentPageNorms] = useState(1);
  const { download, exporting } = useExport();

  useEffect(() => {
    employeesService.get(id).then(setEmployee);
  }, [id]);

  useEffect(() => {
    setCurrentPage(1);
    setCurrentPageNorms(1);
  }, [employee]);

  if (!employee) return <LoadingState label="Загрузка карточки..." />;

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.pageHeader}>
        <div className={`${styles.container} ${styles.pageHeaderContent}`}>
          <div className={styles.title}>
            <h1>Личная карточка сотрудника</h1>
          </div>
        </div>
      </div>
      <div className={styles.container}>
        <>
              <div className="card">
                <h2 className={styles.employeeName}>{employee.full_name}</h2>
                <div className={styles.infoGrid}>
                  <div className={styles.infoCol}>
                    <p><strong>Табельный номер:</strong> {employee.personnel_number || '-'}</p>
                    <p><strong>Должность:</strong> {employee.position}</p>
                    <p><strong>Объект:</strong> {employee.site_name || '-'}</p>
                    <p><strong>Дата приёма:</strong> {employee.hire_date ? new Date(employee.hire_date).toLocaleDateString() : '-'}</p>
                    <p><strong>Дата изменения профессии/подразделения:</strong> {employee.position_change_date ? new Date(employee.position_change_date).toLocaleDateString() : '-'}</p>
                    <p><strong>Пол:</strong> {employee.gender === 'male' ? 'Мужской' : employee.gender === 'female' ? 'Женский' : employee.gender || '-'}</p>
                    <p><strong>Рост:</strong> {employee.height || '-'} см</p>
                  </div>
                  <div className={styles.infoCol}>
                    <p><strong>Размер одежды:</strong> {employee.clothing_size || '-'}</p>
                    <p><strong>Размер обуви:</strong> {employee.shoe_size || '-'}</p>
                    <p><strong>Размер головного убора:</strong> {employee.hat_size || '-'}</p>
                    <p><strong>Размер СИЗОД:</strong> {employee.respirator_size || '-'}</p>
                    <p><strong>Размер СИЗ рук:</strong> {employee.gloves_size || '-'}</p>
                    <p><strong>Статус:</strong> {employee.status === EMPLOYEE_STATUSES.active ? EMPLOYEE_STATUSES.active : EMPLOYEE_STATUSES.terminated}</p>
                  </div>
                </div>
              </div>

            <div className="card">
              <h3 className={styles.sectionTitle}>Экспорт документов</h3>
              <div className={styles.exportActions}>
                <button className="btn" disabled={exporting} onClick={() => download(() => exportsService.exportEmployeeCard(employee.id), `карточка СИЗ ${employee.full_name}.docx`)}>Личная карточка СИЗ (Word)</button>
                <button className="btn btn-secondary" disabled={exporting} onClick={() => download(() => exportsService.exportConsumables(employee.id, 'first'), `Ведомость расходников I полугодие ${employee.full_name}.docx`)}>Ведомость расходников I полугодие</button>
                <button className="btn btn-secondary" disabled={exporting} onClick={() => download(() => exportsService.exportConsumables(employee.id, 'second'), `Ведомость расходников II полугодие ${employee.full_name}.docx`)}>Ведомость расходников II полугодие</button>
              </div>
            </div>

            <div className="card">
              <h3 className={styles.sectionTitle}>Нормы выдачи</h3>
              {(employee.norms?.length || 0) === 0 ? (
                <EmptyState icon={<FontAwesomeIcon icon={faClipboardList} />} title="Нормы не заданы" description="Для этого сотрудника пока не установлены нормы выдачи." />
              ) : (
                <>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Наименование</th>
                        <th>Периодичность</th>
                        <th>Кол-во</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employee.norms?.slice((currentPageNorms - 1) * 10, currentPageNorms * 10).map((norm) => (
                        <tr key={norm.id}>
                          <td>{norm.item_type_name}</td>
                          <td>{norm.period_months} мес</td>
                          <td>{norm.quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <Pagination
                    totalItems={employee.norms?.length || 0}
                    itemsPerPage={10}
                    currentPage={currentPageNorms}
                    onPageChange={setCurrentPageNorms}
                  />
                </>
              )}
            </div>

            <div className="card">
              <h3 className={styles.sectionTitle}>История выдач</h3>
              {(employee.history?.length || 0) === 0 ? (
                <EmptyState icon={<FontAwesomeIcon icon={faBox} />} title="История выдач пуста" description="Сотруднику ещё не выдавались СИЗ." />
              ) : (
                <>
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
                      {employee.history?.slice((currentPage - 1) * 10, currentPage * 10).map((record) => (
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
                             ) : record.status === ISSUE_STATUSES.due_for_disposal ? (
                               <StatusBadge status={ISSUE_STATUSES.due_for_disposal} />
                             ) : (
                               <span className="badge">{record.status}</span>
                             )}
                           </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <Pagination
                    totalItems={employee.history?.length || 0}
                    itemsPerPage={10}
                    currentPage={currentPage}
                    onPageChange={setCurrentPage}
                  />
                </>
              )}
            </div>
          </>
      </div>
    </div>
  );
}
