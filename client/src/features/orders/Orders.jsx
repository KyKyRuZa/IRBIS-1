import { useState, useEffect, useMemo } from 'react';
import { sitesService } from '@/lib/services/sites.service.js';
import { employeesService } from '@/lib/services/employees.service.js';
import Pagination from '@/components/ui/Pagination.jsx';
import LoadingState from '@/components/ui/LoadingState.jsx';
import ErrorState from '@/components/ui/ErrorState.jsx';
import EmptyState from '@/components/ui/EmptyState.jsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBuilding } from '@fortawesome/free-solid-svg-icons';
import styles from '@styles/Orders.module.css';

export default function Orders() {
  const [sites, setSites] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [siteId, setSiteId] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');

  useEffect(() => {
    sitesService.list().then(setSites).catch(() => setError('Не удалось загрузить объекты'));
    setLoading(false);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [siteId]);

  useEffect(() => {
    if (!siteId) {
      setRows([]);
      return;
    }
    setLoading(true);
    employeesService.bySite(siteId)
      .then(setRows)
      .catch(() => setError('Не удалось загрузить сотрудников'))
      .finally(() => setLoading(false));
  }, [siteId]);

  const filtered = useMemo(() => {
    if (!search) return rows;
    const q = search.toLowerCase();
    return rows.filter(r =>
      (r.full_name || '').toLowerCase().includes(q) ||
      (r.position || '').toLowerCase().includes(q)
    );
  }, [rows, search]);

  const startIndex = (currentPage - 1) * 10;
  const paginated = filtered.slice(startIndex, startIndex + 10);

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.pageHeader}>
        <div className={`${styles.container} ${styles.pageHeaderContent}`}>
          <div className={styles.title}>
            <h1>Заказ СИЗ</h1>
            <div className={styles.subtitle}>Размеры сотрудников по объектам для планирования закупок</div>
          </div>
        </div>
      </div>
      <div className={styles.container}>
        <div className="card">
          <div className="table-controls">
            <div className="filter-field">
              <label>Объект</label>
              <select value={siteId} onChange={(e) => setSiteId(e.target.value)}>
                <option value="">Выберите объект...</option>
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            {siteId && (
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Поиск по сотруднику или должности..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            )}
          </div>

          {!siteId && (
            <EmptyState
              icon={<FontAwesomeIcon icon={faBuilding} />}
              title="Выберите объект"
              description="Чтобы увидеть список сотрудников с их размерами, выберите объект выше."
            />
          )}

          {siteId && loading && <LoadingState label="Загрузка..." />}
          {siteId && !loading && error && <ErrorState message={error} />}
          {siteId && !loading && !error && filtered.length === 0 && (
            <EmptyState
              icon={<FontAwesomeIcon icon={faBuilding} />}
              title="Сотрудники не найдены"
              description={search ? 'Поиск не дал результатов.' : 'На объекте нет активных сотрудников.'}
            />
          )}

          {siteId && !loading && !error && filtered.length > 0 && (
            <>
              <div className="tableScroll">
                <table className="table">
                  <thead>
                    <tr>
                      <th>ФИО</th>
                      <th>Должность</th>
                      <th>Размер одежды</th>
                      <th>Размер обуви</th>
                      <th>Размер головного убора</th>
                      <th>Размер СИЗОД</th>
                      <th>Размер СИЗ рук</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((emp) => (
                      <tr key={emp.id}>
                        <td>{emp.full_name}</td>
                        <td>{emp.position}</td>
                        <td>{emp.clothing_size || '-'}</td>
                        <td>{emp.shoe_size || '-'}</td>
                        <td>{emp.hat_size || '-'}</td>
                        <td>{emp.respirator_size || '-'}</td>
                        <td>{emp.gloves_size || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                totalItems={filtered.length}
                itemsPerPage={10}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
