import { useState, useEffect, useRef, useMemo } from 'react';
import { sitesService } from '@lib/services/sites.service.js';
import { itemsService } from '@/lib/services/items.service.js';
import { issuesService } from '@/lib/services/issues.service.js';
import { reportsService } from '@/lib/services/reports.service.js';
import { exportsService } from '@/lib/services/exports.service.js';
import { adminService } from '@/lib/services/admin.service.js';
import { useExport } from '@hooks/useExport.js';
import { useTableControls, filterAndSort } from '@/hooks/useTableControls.js';
import Pagination from '@/components/ui/Pagination.jsx';
import EmptyState from '@/components/ui/EmptyState.jsx';
import SortableTh from '@/components/ui/SortableTh.jsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartBar, faClipboardList, faHourglassHalf } from '@fortawesome/free-solid-svg-icons';
import styles from '@styles/Reports.module.css';

const TABS = [
  { id: 'demand', label: 'Потребность в СИЗ' },
  { id: 'records', label: 'Сводка выдач' },
  { id: 'expiring', label: 'Истекающие сроки' },
];

export default function Reports() {
  const [records, setRecords] = useState([]);
  const [expiring, setExpiring] = useState([]);
  const [sites, setSites] = useState([]);
  const [items, setItems] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [demand, setDemand] = useState([]);
  const [filters, setFilters] = useState({
    site_id: '',
    item_type_id: '',
    date_from: '',
    date_to: '',
    status: ''
  });
  const [activeTab, setActiveTab] = useState('demand');
  const [currentPage, setCurrentPage] = useState(1);
  const [expiringPage, setExpiringPage] = useState(1);
  const [recordsPage, setRecordsPage] = useState(1);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef(null);
  const { download } = useExport();

  const {
    search,
    setSearch,
    sort,
    toggleSort,
    resetFilters: resetTableControls
  } = useTableControls({ sort: null });

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const [sitesRes, itemsRes, recordsRes, expiringRes] = await Promise.all([
          sitesService.list(),
          itemsService.list(),
          issuesService.list(),
          issuesService.getExpiring(2),
        ]);
        if (!mounted) return;
        setSites(Array.isArray(sitesRes) ? sitesRes : []);
        setItems(Array.isArray(itemsRes) ? itemsRes : []);
        setRecords(Array.isArray(recordsRes) ? recordsRes : []);
        setExpiring(Array.isArray(expiringRes) ? expiringRes : []);
      } catch (e) {
        console.error('Failed to load base reports data', e);
      }
      if (!mounted) return;
      try {
        const demandRes = await adminService.getDemand(filters.site_id);
        setDemand(Array.isArray(demandRes) ? demandRes : []);
      } catch (e) {
        console.error('Failed to load demand report', e);
        setDemand([]);
      }
      if (!mounted) return;
      try {
        const notifRes = await adminService.getNotifications();
        setNotifications(Array.isArray(notifRes) ? notifRes : []);
      } catch (e) {
        console.error('Failed to load notifications', e);
        setNotifications([]);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === 'records') {
        fetchRecords();
      }
      if (activeTab === 'demand') {
        fetchDemand();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [filters.site_id, filters.item_type_id, filters.date_from, filters.date_to, filters.status, activeTab]);

  const fetchRecords = async () => {
    const res = await issuesService.list(filters);
    setRecords(res);
  };

  const fetchDemand = async () => {
    const res = await adminService.getDemand(filters.site_id);
    setDemand(res);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const resetFilters = () => {
    setFilters({ site_id: '', item_type_id: '', date_from: '', date_to: '', status: '' });
    setRecordsPage(1);
    issuesService.list().then(res => setRecords(Array.isArray(res) ? res : []));
    adminService.getDemand('').then(res => setDemand(Array.isArray(res) ? res : []));
  };

  const formatDate = (dateStr) => dateStr ? new Date(dateStr).toLocaleDateString('ru-RU') : '';
  const reportDateRange = () => {
    const from = formatDate(filters.date_from);
    const to = formatDate(filters.date_to);
    if (from && to) return `${from} - ${to}`;
    if (from) return `с ${from}`;
    if (to) return `по ${to}`;
    return new Date().toLocaleDateString('ru-RU');
  };

  const handleExcelExport = async () => {
    setShowExportMenu(false);
    download(() => reportsService.exportExcel(filters), `Экспорт в Excel ${reportDateRange()}.xlsx`);
  };

  const handleDemandExport = async () => {
    setShowExportMenu(false);
    download(() => reportsService.exportDemandExcel(filters.site_id), `Потребность в СИЗ ${reportDateRange()}.xlsx`);
  };

  const handleIssuesReport = async () => {
    setShowExportMenu(false);
    download(() => exportsService.exportIssuesReport(), `Отчёт по выдачам ${new Date().toLocaleDateString('ru-RU')}.docx`);
  };

  const handleExpiringReport = async () => {
    setShowExportMenu(false);
    download(() => exportsService.exportExpiringReport(), `Отчёт по истекающим срокам ${new Date().toLocaleDateString('ru-RU')}.docx`);
  };

  const handleGroupConsumables = async () => {
    setShowExportMenu(false);
    const siteId = prompt('Введите ID объекта для групповой ведомости расходников:');
    if (siteId) {
      download(() => exportsService.exportGroupConsumables(siteId), `Групповая ведомость расходников ${new Date().toLocaleDateString('ru-RU')}.docx`);
    }
  };

  const handleAllCards = async () => {
    setShowExportMenu(false);
    download(() => exportsService.exportAllCards(), `Все карточки СИЗ ${new Date().toLocaleDateString('ru-RU')}.docx`);
  };

  const handleBackup = async () => {
    setShowExportMenu(false);
    download(() => adminService.backupDatabase(), `Резервная копия БД ${new Date().toISOString().replace(/[:.]/g, '-')}.sql`);
  };

  const sortedDemand = useMemo(() => filterAndSort(demand, {
    search, filters: {}, sort, searchFields: ['item_name', 'category']
  }), [demand, search, sort]);

  const sortedRecords = useMemo(() => filterAndSort(records, {
    search, filters: {}, sort, searchFields: ['full_name', 'position', 'item_type_name']
  }), [records, search, sort]);

  const sortedExpiring = useMemo(() => filterAndSort(expiring, {
    search, filters: {}, sort, searchFields: ['full_name', 'item_type_name']
  }), [expiring, search, sort]);

  const demandStart = (currentPage - 1) * 10;
  const paginatedDemand = sortedDemand.slice(demandStart, demandStart + 10);

  const recordsStart = (recordsPage - 1) * 10;
  const paginatedRecords = sortedRecords.slice(recordsStart, recordsStart + 10);

  const expiringStart = (expiringPage - 1) * 10;
  const paginatedExpiring = sortedExpiring.slice(expiringStart, expiringStart + 10);

  const hasActiveFilters = Boolean(search) || Boolean(filters.site_id) || Boolean(filters.item_type_id) || Boolean(filters.date_from) || Boolean(filters.date_to) || Boolean(filters.status);

  const dangerCount = notifications.filter(n => n.severity === 'danger').length;

  const exportMenuItems = [
    { label: 'Экспорт в Excel', onClick: handleExcelExport },
    { label: 'Потребность в СИЗ (Excel)', onClick: handleDemandExport },
    { label: 'Отчёт по выдачам (Word)', onClick: handleIssuesReport },
    { label: 'Отчёт по истекающим срокам (Word)', onClick: handleExpiringReport },
    { label: 'Групповая ведомость расходников', onClick: handleGroupConsumables },
    { label: 'Все карточки СИЗ (Word ZIP)', onClick: handleAllCards },
    { label: 'Резервная копия БД', onClick: handleBackup },
  ];

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.pageHeader}>
        <div className={`${styles.container} ${styles.pageHeaderContent}`}>
          <div className={styles.title}>
            <h1>Отчёты</h1>
            <div className={styles.subtitle}>Аналитика, экспорт и сводные данные</div>
          </div>
          <div className={styles.headerActions}>
            <button
              className={`btn btn-secondary ${styles.notificationsToggle}`}
              onClick={() => setShowNotifications(!showNotifications)}
            >
              {dangerCount > 0 && <span className={styles.badge}>{dangerCount}</span>}
              Уведомления
            </button>
          </div>
        </div>
      </div>

      {showNotifications && (
        <div className={styles.container}>
          <div className={styles.notificationsPanel}>
            <h4 className={styles.notificationsTitle}>Уведомления</h4>
            {notifications.length === 0 ? (
              <p>Нет уведомлений</p>
            ) : (
              <ul className={styles.notificationsList}>
                {notifications.map((n) => (
                  <li key={n.id} className={`${styles.notificationItem} ${n.severity === 'danger' ? styles.notificationItemDanger : styles.notificationItemWarning}`}>
                    <strong>{n.type === 'expiring_item' ? '⚠️ Истекает срок' :
                             n.type === 'expired_item' ? '❌ Просрочено' :
                             n.type === 'expiring_certificate' ? '⚠️ Сертификат истекает' :
                             n.type === 'expired_certificate' ? '❌ Сертификат просрочен' :
                             n.type === 'reorder' ? '📦 Заказ партии' : n.type}:</strong> {n.message}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      <div className={styles.container}>
        <div className="card">
          <div className="table-controls">
            <div className="search-box">
              <input
                type="text"
                name="search"
                placeholder="Поиск по таблице..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="filter-field">
              <label>Объект</label>
              <select name="site_id" value={filters.site_id} onChange={handleFilterChange}>
                <option value="">Все</option>
                {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="filter-field">
              <label>Вид СИЗ</label>
              <select name="item_type_id" value={filters.item_type_id} onChange={handleFilterChange}>
                <option value="">Все</option>
                {items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </div>
            <div className="filter-field">
              <label>С даты</label>
              <input type="date" name="date_from" value={filters.date_from} onChange={handleFilterChange} />
            </div>
            <div className="filter-field">
              <label>По дату</label>
              <input type="date" name="date_to" value={filters.date_to} onChange={handleFilterChange} />
            </div>
            <div className="filter-field">
              <label>Статус</label>
              <select name="status" value={filters.status} onChange={handleFilterChange}>
                <option value="">Все</option>
                <option value="issued">Выдано</option>
                <option value="disposed">Списано</option>
                <option value="returned">Возвращено</option>
                <option value="due_for_disposal">Подлежит списанию</option>
              </select>
            </div>

            <div className={styles.toolbarRight} ref={exportMenuRef}>
              <button className="btn" onClick={() => setShowExportMenu(!showExportMenu)}>
                Экспорт
              </button>
              {showExportMenu && (
                <div className={styles.exportMenu}>
                  {exportMenuItems.map((item, i) => (
                    <button key={i} className={styles.exportMenuItem} onClick={item.onClick}>
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {hasActiveFilters && (
              <button className="btn btn-secondary filter-reset" onClick={() => { resetFilters(); resetTableControls(); }}>
                Сбросить
              </button>
            )}
          </div>

          <div className={styles.tabs}>
            {TABS.map(tab => (
              <button
                key={tab.id}
                className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
                {tab.id === 'expiring' && expiring.length > 0 && (
                  <span className={styles.tabBadge}>{expiring.length}</span>
                )}
              </button>
            ))}
          </div>

          {activeTab === 'demand' && (
            <>
              {sortedDemand.length === 0 ? (
                <EmptyState icon={<FontAwesomeIcon icon={faChartBar} />} title="Нет данных о потребности" description={Boolean(search) ? 'По поиску ничего не найдено.' : 'Добавьте сотрудников, нормы и выдачи, чтобы увидеть потребность в СИЗ.'} />
              ) : (
                <>
                  <table className="table">
                    <thead>
                      <tr>
                        <SortableTh label="Наименование" sortKey="item_name" sort={sort} onSort={toggleSort} />
                        <SortableTh label="Категория" sortKey="category" sort={sort} onSort={toggleSort} />
                        <SortableTh label="Используется (шт)" sortKey="in_use_qty" sort={sort} onSort={toggleSort} />
                        <SortableTh label="Норма (шт)" sortKey="norm_qty" sort={sort} onSort={toggleSort} />
                        <SortableTh label="Потребность (шт)" sortKey="demand_qty" sort={sort} onSort={toggleSort} />
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedDemand.map((d) => (
                        <tr key={d.item_type_id}>
                          <td>{d.item_name}</td>
                          <td>{d.category}</td>
                          <td>{d.in_use_qty}</td>
                          <td>{d.norm_qty}</td>
                          <td className={styles.demandValue}>{d.demand_qty}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <Pagination totalItems={sortedDemand.length} itemsPerPage={10} currentPage={currentPage} onPageChange={setCurrentPage} />
                </>
              )}
            </>
          )}

          {activeTab === 'records' && (
            <>
              {sortedRecords.length === 0 ? (
                <EmptyState icon={<FontAwesomeIcon icon={faClipboardList} />} title="Нет записей о выдачах" description={Boolean(search) ? 'По поиску ничего не найдено.' : 'Выдачи сотрудникам ещё не зарегистрированы.'} />
              ) : (
                <>
                  <table className="table">
                    <thead>
                      <tr>
                        <SortableTh label="Сотрудник" sortKey="full_name" sort={sort} onSort={toggleSort} />
                        <SortableTh label="Должность" sortKey="position" sort={sort} onSort={toggleSort} />
                        <SortableTh label="Наименование" sortKey="item_type_name" sort={sort} onSort={toggleSort} />
                        <SortableTh label="Дата выдачи" sortKey="issue_date" sort={sort} onSort={toggleSort} />
                        <SortableTh label="Срок годности" sortKey="expiry_date" sort={sort} onSort={toggleSort} />
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedRecords.map((r) => (
                        <tr key={r.id}>
                          <td>{r.full_name}</td>
                          <td>{r.position}</td>
                          <td>{r.item_type_name}</td>
                          <td>{new Date(r.issue_date).toLocaleDateString()}</td>
                          <td>{r.expiry_date ? new Date(r.expiry_date).toLocaleDateString() : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <Pagination totalItems={sortedRecords.length} itemsPerPage={10} currentPage={recordsPage} onPageChange={setRecordsPage} />
                </>
              )}
            </>
          )}

          {activeTab === 'expiring' && (
            <>
              {sortedExpiring.length === 0 ? (
                <EmptyState icon={<FontAwesomeIcon icon={faHourglassHalf} />} title="Нет истекающих сроков" description={Boolean(search) ? 'По поиску ничего не найдено.' : 'В ближайшие 2 месяца сроки годности не истекают.'} />
              ) : (
                <>
                  <p className={styles.sectionSubtitle}>Истекающие сроки годности (в течение 2 месяцев)</p>
                  <table className="table">
                    <thead>
                      <tr>
                        <SortableTh label="Сотрудник" sortKey="full_name" sort={sort} onSort={toggleSort} />
                        <SortableTh label="Наименование" sortKey="item_type_name" sort={sort} onSort={toggleSort} />
                        <SortableTh label="Дата выдачи" sortKey="issue_date" sort={sort} onSort={toggleSort} />
                        <SortableTh label="Срок годности" sortKey="expiry_date" sort={sort} onSort={toggleSort} />
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedExpiring.map((r) => (
                        <tr key={r.id}>
                          <td>{r.full_name}</td>
                          <td>{r.item_type_name}</td>
                          <td>{new Date(r.issue_date).toLocaleDateString()}</td>
                          <td>{new Date(r.expiry_date).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <Pagination totalItems={sortedExpiring.length} itemsPerPage={10} currentPage={expiringPage} onPageChange={setExpiringPage} />
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
