import { useState, useEffect } from 'react';
import { sitesService } from '@lib/services/sites.service.js';
import { itemsService } from '@/lib/services/items.service.js';
import { issuesService } from '@/lib/services/issues.service.js';
import { reportsService } from '@/lib/services/reports.service.js';
import { exportsService } from '@/lib/services/exports.service.js';
import { adminService } from '@/lib/services/admin.service.js';
import { useExport } from '@hooks/useExport.js';
import Pagination from '@/components/ui/Pagination.jsx';
import styles from './Reports.module.css';

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
  const [currentPage, setCurrentPage] = useState(1);
  const [expiringPage, setExpiringPage] = useState(1);
  const [recordsPage, setRecordsPage] = useState(1);
  const { download } = useExport();

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
    setCurrentPage(1);
  }, [demand, records, expiring]);

  const fetchSites = async () => {
    const res = await sitesService.list();
    setSites(res);
  };

  const demandStart = (currentPage - 1) * 10;
  const paginatedDemand = demand.slice(demandStart, demandStart + 10);

  const recordsStart = (recordsPage - 1) * 10;
  const paginatedRecords = records.slice(recordsStart, recordsStart + 10);

  const expiringStart = (expiringPage - 1) * 10;
  const paginatedExpiring = expiring.slice(expiringStart, expiringStart + 10);

  const fetchItems = async () => {
    const res = await itemsService.list();
    setItems(res);
  };

  const fetchRecords = async () => {
    const res = await issuesService.list(filters);
    setRecords(res);
  };

  const fetchExpiring = async () => {
    const res = await issuesService.getExpiring(2);
    setExpiring(res);
  };

  const fetchDemand = async () => {
    const res = await adminService.getDemand(filters.site_id);
    setDemand(res);
  };

  const fetchNotifications = async () => {
    const res = await adminService.getNotifications();
    setNotifications(res);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    fetchRecords();
    fetchDemand();
  };

  const handleExcelExport = async () => {
    download(() => reportsService.exportExcel(filters), 'irbis-act-vydachi.xlsx');
  };

  const handleDemandExport = async () => {
    download(() => reportsService.exportDemandExcel(filters.site_id), 'potrebnost_siz.xlsx');
  };

  const handleIssuesReport = async () => {
    download(() => exportsService.exportIssuesReport(), 'issues-report.docx');
  };

  const handleExpiringReport = async () => {
    download(() => exportsService.exportExpiringReport(), 'expiring-report.docx');
  };

  const handleGroupConsumables = async () => {
    const siteId = prompt('Введите ID объекта для групповой ведомости расходников:');
    if (siteId) {
      download(() => exportsService.exportGroupConsumables(siteId), 'group-consumables.docx');
    }
  };

  const handleAllCards = async () => {
    download(() => exportsService.exportAllCards(), 'all-cards.docx');
  };

  const handleBackup = async () => {
    download(() => adminService.backupDatabase(), 'irbis-backup.sql');
  };

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.pageHeader}>
        <div className={`container ${styles.pageHeaderContent}`}>
          <div className={styles.title}>
            <h1>Отчёты</h1>
            <div className={styles.subtitle}>Аналитика, экспорт и сводные данные</div>
          </div>
        </div>
      </div>
      <div className="container">
      <div className="card">
        <div className={styles.headerRow}>
          <h2 className={styles.headerTitle}>Отчёты</h2>
          <button className="btn btn-secondary notificationsToggle" onClick={() => setShowNotifications(!showNotifications)}>
            Уведомления ({notifications.filter(n => n.severity === 'danger').length})
          </button>
        </div>

        {showNotifications && (
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
        )}

        <div className={styles.filtersRow}>
          <div className={`form-group ${styles.filterGroup}`}>
            <label>Объект</label>
            <select className="form-control" name="site_id" value={filters.site_id} onChange={handleFilterChange}>
              <option value="">Все</option>
              {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className={`form-group ${styles.filterGroup}`}>
            <label>Вид СИЗ</label>
            <select className="form-control" name="item_type_id" value={filters.item_type_id} onChange={handleFilterChange}>
              <option value="">Все</option>
              {items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </div>
          <div className={`form-group ${styles.filterGroup}`}>
            <label>С даты</label>
            <input type="date" className="form-control" name="date_from" value={filters.date_from} onChange={handleFilterChange} />
          </div>
          <div className={`form-group ${styles.filterGroup}`}>
            <label>По дату</label>
            <input type="date" className="form-control" name="date_to" value={filters.date_to} onChange={handleFilterChange} />
          </div>
          <div className={`form-group ${styles.filterGroup}`}>
            <label>Статус</label>
            <select className="form-control" name="status" value={filters.status} onChange={handleFilterChange}>
              <option value="">Все</option>
              <option value="issued">Выдано</option>
              <option value="disposed">Списано</option>
              <option value="returned">Возвращено</option>
              <option value="due_for_disposal">Подлежит списанию</option>
            </select>
          </div>
          <button className="btn" onClick={applyFilters}>Применить</button>
          <button className="btn btn-secondary" onClick={() => setFilters({ site_id: '', item_type_id: '', date_from: '', date_to: '', status: '' })}>Сбросить</button>
        </div>

        <div className={styles.actionsRow}>
          <button className="btn" onClick={handleExcelExport}>Экспорт в Excel</button>
          <button className="btn" onClick={handleIssuesReport}>Отчёт по выдачам (Word)</button>
          <button className="btn" onClick={handleExpiringReport}>Отчёт по истекающим срокам (Word)</button>
          <button className="btn" onClick={handleDemandExport}>Потребность в СИЗ (Excel)</button>
          <button className="btn btn-secondary" onClick={handleGroupConsumables}>Групповая ведомость расходников (Word)</button>
          <button className="btn btn-secondary" onClick={handleAllCards}>Все карточки СИЗ (Word ZIP)</button>
          <button className="btn btn-secondary" onClick={handleBackup}>Резервная копия БД</button>
        </div>
      </div>

      {demand.length > 0 && (
        <div className="card">
          <h3 className={styles.sectionTitle}>Сводная «Потребность в спецодежде»</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Наименование</th>
                <th>Категория</th>
                <th>Используется (шт)</th>
                <th>Норма (шт)</th>
                <th>Потребность (шт)</th>
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
          <Pagination
            totalItems={demand.length}
            itemsPerPage={10}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      <div className="card">
        <h3 className={styles.sectionTitle}>Сводка выдач</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Сотрудник</th>
              <th>Должность</th>
              <th>Наименование</th>
              <th>Дата выдачи</th>
              <th>Срок годности</th>
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
          <Pagination
            totalItems={records.length}
            itemsPerPage={10}
            currentPage={recordsPage}
            onPageChange={setRecordsPage}
          />
      </div>

      <div className="card">
        <h3 className={`${styles.sectionTitle} ${styles.error}`}>
          Истекающие сроки годности (в течение 2 месяцев)
        </h3>
        <table className="table">
          <thead>
            <tr>
              <th>Сотрудник</th>
              <th>Наименование</th>
              <th>Дата выдачи</th>
              <th>Срок годности</th>
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
          <Pagination
            totalItems={expiring.length}
            itemsPerPage={10}
            currentPage={expiringPage}
            onPageChange={setExpiringPage}
          />
      </div>
      </div>
    </div>
  );
}
