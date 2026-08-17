import { useState, useEffect } from 'react';
import axios from 'axios';

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

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const [sitesRes, itemsRes, recordsRes, expiringRes] = await Promise.all([
          axios.get('/api/sites'),
          axios.get('/api/items'),
          axios.get('/api/issues'),
          axios.get('/api/issues/expiring?months=2'),
        ]);
        if (!mounted) return;
        setSites(Array.isArray(sitesRes.data) ? sitesRes.data : []);
        setItems(Array.isArray(itemsRes.data) ? itemsRes.data : []);
        setRecords(Array.isArray(recordsRes.data) ? recordsRes.data : []);
        setExpiring(Array.isArray(expiringRes.data) ? expiringRes.data : []);
      } catch (e) {
        console.error('Failed to load base reports data', e);
      }
      if (!mounted) return;
      try {
        const demandRes = await axios.get('/api/admin/demand', { params: { site_id: filters.site_id } });
        setDemand(Array.isArray(demandRes.data) ? demandRes.data : []);
      } catch (e) {
        console.error('Failed to load demand report', e);
        setDemand([]);
      }
      if (!mounted) return;
      try {
        const notifRes = await axios.get('/api/admin/notifications');
        setNotifications(Array.isArray(notifRes.data) ? notifRes.data : []);
      } catch (e) {
        console.error('Failed to load notifications', e);
        setNotifications([]);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const fetchSites = async () => {
    const res = await axios.get('/api/sites');
    setSites(res.data);
  };

  const fetchItems = async () => {
    const res = await axios.get('/api/items');
    setItems(res.data);
  };

  const fetchRecords = async () => {
    const res = await axios.get('/api/issues', { params: filters });
    setRecords(res.data);
  };

  const fetchExpiring = async () => {
    const res = await axios.get('/api/issues/expiring?months=2');
    setExpiring(res.data);
  };

  const fetchDemand = async () => {
    const res = await axios.get('/api/admin/demand', { params: { site_id: filters.site_id } });
    setDemand(res.data);
  };

  const fetchNotifications = async () => {
    const res = await axios.get('/api/admin/notifications');
    setNotifications(res.data);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    fetchRecords();
    fetchDemand();
  };

  const handleExcelExport = () => {
    const params = new URLSearchParams();
    if (filters.site_id) params.append('site_id', filters.site_id);
    if (filters.item_type_id) params.append('item_type_id', filters.item_type_id);
    if (filters.date_from) params.append('date_from', filters.date_from);
    if (filters.date_to) params.append('date_to', filters.date_to);
    if (filters.status) params.append('status', filters.status);
    window.open(`/api/reports/excel?${params.toString()}`, '_blank');
  };

  const handleDemandExport = () => {
    const params = new URLSearchParams();
    if (filters.site_id) params.append('site_id', filters.site_id);
    window.open(`/api/reports/demand/excel?${params.toString()}`, '_blank');
  };

  const handleGroupConsumables = () => {
    const siteId = prompt('Введите ID объекта для групповой ведомости расходников:');
    if (siteId) {
      window.open(`/api/export/group-consumables?site_id=${siteId}`, '_blank');
    }
  };

  return (
    <div className="page-wrapper page-reports">
      <div className="page-header">
        <div className="container">
          <div>
            <h1>Отчёты</h1>
            <div className="page-subtitle">Аналитика, экспорт и сводные данные</div>
          </div>
        </div>
      </div>
      <div className="container">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ color: 'var(--primary)', marginBottom: '0' }}>Отчёты</h2>
          <button className="btn btn-secondary" onClick={() => setShowNotifications(!showNotifications)}>
            Уведомления ({notifications.filter(n => n.severity === 'danger').length})
          </button>
        </div>

        {showNotifications && (
          <div style={{ marginBottom: '20px', padding: '15px', background: '#fff3cd', borderRadius: '8px', border: '1px solid #ffc107' }}>
            <h4 style={{ marginBottom: '10px' }}>Уведомления</h4>
            {notifications.length === 0 ? (
              <p>Нет уведомлений</p>
            ) : (
              <ul style={{ paddingLeft: '20px' }}>
                {notifications.map((n) => (
                  <li key={n.id} style={{ 
                    marginBottom: '8px',
                    color: n.severity === 'danger' ? '#d32f2f' : '#f57c00'
                  }}>
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
        
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ marginBottom: '0', minWidth: '150px' }}>
            <label>Объект</label>
            <select className="form-control" name="site_id" value={filters.site_id} onChange={handleFilterChange}>
              <option value="">Все</option>
              {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: '0', minWidth: '150px' }}>
            <label>Вид СИЗ</label>
            <select className="form-control" name="item_type_id" value={filters.item_type_id} onChange={handleFilterChange}>
              <option value="">Все</option>
              {items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: '0', minWidth: '130px' }}>
            <label>С даты</label>
            <input type="date" className="form-control" name="date_from" value={filters.date_from} onChange={handleFilterChange} />
          </div>
          <div className="form-group" style={{ marginBottom: '0', minWidth: '130px' }}>
            <label>По дату</label>
            <input type="date" className="form-control" name="date_to" value={filters.date_to} onChange={handleFilterChange} />
          </div>
          <div className="form-group" style={{ marginBottom: '0', minWidth: '130px' }}>
            <label>Статус</label>
            <select className="form-control" name="status" value={filters.status} onChange={handleFilterChange}>
              <option value="">Все</option>
              <option value="issued">Выдано</option>
              <option value="disposed">Списано</option>
              <option value="returned">Возвращено</option>
            </select>
          </div>
          <button className="btn" onClick={applyFilters}>Применить</button>
          <button className="btn btn-secondary" onClick={() => setFilters({ site_id: '', item_type_id: '', date_from: '', date_to: '', status: '' })}>Сбросить</button>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <button className="btn" onClick={handleExcelExport}>Экспорт в Excel</button>
          <button className="btn" onClick={() => window.open('/api/export/issues-report', '_blank')}>Отчёт по выдачам (Word)</button>
          <button className="btn" onClick={() => window.open('/api/export/expiring-report', '_blank')}>Отчёт по истекающим срокам (Word)</button>
          <button className="btn" onClick={handleDemandExport}>Потребность в СИЗ (Excel)</button>
          <button className="btn btn-secondary" onClick={handleGroupConsumables}>Групповая ведомость расходников (Word)</button>
          <button className="btn btn-secondary" onClick={() => window.open('/api/export/all-cards', '_blank')}>Все карточки СИЗ (Word ZIP)</button>
          <button className="btn btn-secondary" onClick={() => window.open('/api/admin/backup', '_blank')}>Резервная копия БД</button>
        </div>
      </div>

      {demand.length > 0 && (
        <div className="card">
          <h3 style={{ color: 'var(--primary)', marginBottom: '15px' }}>Сводная «Потребность в спецодежде»</h3>
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
              {demand.map((d) => (
                <tr key={d.item_type_id}>
                  <td>{d.item_name}</td>
                  <td>{d.category}</td>
                  <td>{d.in_use_qty}</td>
                  <td>{d.norm_qty}</td>
                  <td style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{d.demand_qty}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="card">
        <h3 style={{ color: 'var(--primary)', marginBottom: '15px' }}>Сводка выдач</h3>
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
            {records.map((r) => (
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
      </div>

      <div className="card">
        <h3 style={{ color: '#d32f2f', marginBottom: '15px' }}>
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
            {expiring.map((r) => (
              <tr key={r.id}>
                <td>{r.full_name}</td>
                <td>{r.item_type_name}</td>
                <td>{new Date(r.issue_date).toLocaleDateString()}</td>
                <td>{new Date(r.expiry_date).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </div>
    </div>
  );
}
