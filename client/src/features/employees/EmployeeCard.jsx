import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth.js'
import { employeesService } from '@/lib/services/employees.service.js'
import {
  EMPLOYEE_STATUSES,
  EMPLOYEE_STATUS_VALUES,
  normalizeEmployeeStatus,
} from '@/lib/constants/employee-statuses.js'
import { ISSUE_STATUSES, ISSUE_STATUS_LABELS } from '@/lib/constants/issue-statuses.js'
import StatusBadge from '@/components/ui/StatusBadge.jsx'
import Dropdown from '@components/ui/Dropdown.jsx'
import Pagination from '@/components/ui/Pagination.jsx'
import LoadingState from '@/components/ui/LoadingState.jsx'
import ErrorState from '@/components/ui/ErrorState.jsx'
import EmptyState from '@/components/ui/EmptyState.jsx'
import Icon from '@components/ui/Icon.jsx'
import { exportsService } from '@/lib/services/exports.service.js'
import { useExport } from '@hooks/useExport.js'
import { formatDate } from '@/lib/utils/date.js'
import styles from '@styles/EmployeeCard.module.css'

function useIssueEvents(employee) {
  return useMemo(() => {
    const byDate = new Map()
    ;(employee?.history || []).forEach((record) => {
      const key = (record.issue_date || '').slice(0, 10)
      if (!key || byDate.has(key)) return
      byDate.set(key, { issue_date: key, sheetNumber: record.sheet_number || 2 })
    })
    return [...byDate.values()].sort((a, b) => a.issue_date.localeCompare(b.issue_date))
  }, [employee])
}

export default function EmployeeCard() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [currentPage, setCurrentPage] = useState(1)
  const [currentPageNorms, setCurrentPageNorms] = useState(1)
  const [selectedEvent, setSelectedEvent] = useState('')
  const { download, exporting } = useExport()

  const { user } = useAuth()
  const {
    data: employee,
    isLoading: loading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ['employee', user?.id, id],
    queryFn: () => employeesService.get(id),
    staleTime: 5 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
    enabled: !!id,
  })

  const error = queryError ? (queryError.response?.data?.error || queryError.message || 'Ошибка загрузки') : ''

  const events = useIssueEvents(employee)

  useEffect(() => {
    setCurrentPage(1)
    setCurrentPageNorms(1)
  }, [employee])

  useEffect(() => {
    if (events.length > 0) setSelectedEvent(events[events.length - 1].issue_date)
  }, [events])

  if (loading) return <LoadingState label="Загрузка карточки..." />
  if (error && !employee) return <ErrorState message={error} onRetry={refetch} />
  if (!employee) return <LoadingState label="Загрузка карточки..." />

  const currentYear = new Date().getFullYear()

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.pageHeader}>
        <div className={`${styles.container} ${styles.pageHeaderContent}`}>
          <div className={styles.title}>
            <button type="button" className={styles.backButton} onClick={() => navigate(-1)}>
              <Icon name="chevronLeft" size={20} />
            </button>
            <div>
              <h1>Личная карточка сотрудника</h1>
            </div>
          </div>
        </div>
      </div>
      <div className={styles.container}>
        <>
          <div className="card">
            <h2 className={styles.employeeName}>{employee.full_name}</h2>
            <div className={styles.infoGrid}>
              <div className={styles.infoCol}>
                <p>
                  <strong>Табельный номер:</strong> {employee.personnel_number || '-'}
                </p>
                <p>
                  <strong>Должность:</strong> {employee.position}
                </p>
                <p>
                  <strong>Объект:</strong> {employee.site_name || '-'}
                </p>
                <p>
                  <strong>Дата приёма:</strong>{' '}
                  {formatDate(employee.hire_date) || '-'}
                </p>
                <p>
                  <strong>Дата изменения профессии/подразделения:</strong>{' '}
                  {formatDate(employee.position_change_date) || '-'}
                </p>
                <p>
                  <strong>Пол:</strong>{' '}
                  {employee.gender === 'male'
                    ? 'Мужской'
                    : employee.gender === 'female'
                      ? 'Женский'
                      : employee.gender || '-'}
                </p>
                <p>
                  <strong>Рост:</strong> {employee.height || '-'} см
                </p>
              </div>
              <div className={styles.infoCol}>
                <p>
                  <strong>Размер одежды:</strong> {employee.clothing_size || '-'}
                </p>
                <p>
                  <strong>Размер обуви:</strong> {employee.shoe_size || '-'}
                </p>
                <p>
                  <strong>Размер головного убора:</strong> {employee.hat_size || '-'}
                </p>
                <p>
                  <strong>Размер СИЗОД:</strong> {employee.respirator_size || '-'}
                </p>
                <p>
                  <strong>Размер СИЗ рук:</strong> {employee.gloves_size || '-'}
                </p>
                <p>
                  <strong>Шаблон норм:</strong>{' '}
                  {employee.template_id
                    ? employee.templates?.find((t) => t.id === Number(employee.template_id))?.name ||
                      `#${employee.template_id}`
                    : 'Не назначен'}
                </p>
                <p>
                  <strong>Статус:</strong>{' '}
                  {normalizeEmployeeStatus(employee.status) === EMPLOYEE_STATUS_VALUES.active ? (
                    <span className={styles.statusBadgeActive}>{EMPLOYEE_STATUSES.active}</span>
                  ) : (
                    <span className={styles.statusBadgeTerminated}>
                      {EMPLOYEE_STATUSES.terminated}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className={styles.sectionTitle}>Печать карточки СИЗ</h3>
            <div className={styles.printRow}>
              <button
                className="btn"
                disabled={exporting}
                onClick={() =>
                  download(
                    () => exportsService.exportEmployeeCard(employee.id),
                    `Титульный лист СИЗ ${employee.full_name}.docx`
                  )
                }
              >
                Титульный лист (Word)
              </button>
              {events.length > 0 && (
                <>
                  <div className={styles.sheetSelect}>
                    <Dropdown
                      value={selectedEvent}
                      onChange={setSelectedEvent}
                      placeholder="Выберите выдачу"
                      aria-label="Выберите выдачу"
                    >
                      {events.map((event) => (
                        <option key={event.issue_date} value={event.issue_date}>
                        Лист {event.sheetNumber} — {formatDate(event.issue_date)}
                        </option>
                      ))}
                    </Dropdown>
                  </div>
                  <button
                    className="btn"
                    disabled={exporting || !selectedEvent}
                    onClick={() =>
                      download(
                        () => exportsService.exportEmployeeSheet(employee.id, selectedEvent),
                        `Лист выдачи ${employee.full_name} ${selectedEvent}.docx`
                      )
                    }
                  >
                    Печать листа выдачи
                  </button>
                  <button
                    className="btn btn-secondary"
                    disabled={exporting}
                    onClick={() =>
                      download(
                        () => exportsService.exportEmployeeSheets(employee.id, currentYear),
                        `Листы выдачи ${employee.full_name} ${currentYear}.zip`
                      )
                    }
                  >
                    Все листы за {currentYear} (zip)
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="card">
            <h3 className={styles.sectionTitle}>Экспорт документов</h3>
            <div className={styles.exportActions}>
              <button
                className="btn btn-secondary"
                disabled={exporting}
                onClick={() =>
                  download(
                    () => exportsService.exportConsumables(employee.id, 'first'),
                    `Ведомость расходников I полугодие ${employee.full_name}.docx`
                  )
                }
              >
                Ведомость расходников I полугодие
              </button>
              <button
                className="btn btn-secondary"
                disabled={exporting}
                onClick={() =>
                  download(
                    () => exportsService.exportConsumables(employee.id, 'second'),
                    `Ведомость расходников II полугодие ${employee.full_name}.docx`
                  )
                }
              >
                Ведомость расходников II полугодие
              </button>
            </div>
          </div>

          <div className="card">
            <h3 className={styles.sectionTitle}>Нормы выдачи</h3>
            {(employee.norms?.length || 0) === 0 ? (
              <EmptyState
                icon={<Icon name="clipboardList" size={48} />}
                title="Нормы не заданы"
                description="Для этого сотрудника пока не установлены нормы выдачи."
              />
            ) : (
              <>
                <div className="tableScroll">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Наименование</th>
                        <th>Пункт нормы ЕТН</th>
                        <th>Периодичность</th>
                        <th>Кол-во</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employee.norms
                        ?.slice((currentPageNorms - 1) * 10, currentPageNorms * 10)
                        .map((norm) => (
                          <tr key={norm.id}>
                            <td>{norm.item_type_name}</td>
                            <td>{norm.item_type_etn_point || '-'}</td>
                            <td>{norm.period_months} мес</td>
                            <td>{norm.quantity}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
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
              <EmptyState
                icon={<Icon name="package" size={48} />}
                title="История выдач пуста"
                description="Сотруднику ещё не выдавались СИЗ."
              />
            ) : (
              <>
                <div className="tableScroll">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Дата</th>
                        <th>Наименование</th>
                        <th>Кол-во</th>
                        <th>Срок годности</th>
                        <th>Лист карточки</th>
                        <th>Статус</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employee.history
                        ?.slice((currentPage - 1) * 10, currentPage * 10)
                        .map((record) => (
                          <tr key={record.id}>
                            <td>{formatDate(record.issue_date)}</td>
                            <td>{record.item_type_name}</td>
                            <td>{record.quantity}</td>
                            <td>{record.expiry_date ? formatDate(record.expiry_date) : '-'}</td>
                            <td>{record.sheet_number ?? '-'}</td>
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
                </div>
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
  )
}
