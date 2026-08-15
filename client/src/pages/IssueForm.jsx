import { useState, useEffect } from 'react';
import axios from 'axios';

export default function IssueForm() {
  const [employees, setEmployees] = useState([]);
  const [items, setItems] = useState([]);
  const [sites, setSites] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [records, setRecords] = useState([]);
  const [isGroup, setIsGroup] = useState(false);
  const [selectedSite, setSelectedSite] = useState('');
  const [formData, setFormData] = useState({
    employee_id: '',
    item_type_id: '',
    quantity: 1,
    certificate_id: '',
    wear_time_override: '',
    signature_path: '',
    notes: ''
  });

  useEffect(() => {
    fetchEmployees();
    fetchItems();
    fetchSites();
    fetchRecords();
  }, []);

  const fetchEmployees = async () => {
    const res = await axios.get('/api/employees?status=active');
    setEmployees(res.data);
  };

  const fetchSites = async () => {
    const res = await axios.get('/api/sites');
    setSites(res.data);
  };

  const fetchItems = async () => {
    const res = await axios.get('/api/items');
    setItems(res.data);
  };

  const fetchRecords = async () => {
    const res = await axios.get('/api/issues');
    setRecords(res.data);
  };

  const handleItemChange = async (itemId) => {
    setFormData({...formData, item_type_id: itemId});
    if (itemId) {
      const certs = await axios.get(`/api/certificates/item/${itemId}`);
      setCertificates(certs.data);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isGroup) {
      await axios.post('/api/issues/batch', {
        site_id: selectedSite,
        item_type_id: formData.item_type_id,
        quantity: formData.quantity,
        certificate_id: formData.certificate_id,
        wear_time_override: formData.wear_time_override,
        notes: formData.notes
      });
    } else {
      await axios.post('/api/issues', {
        employee_id: formData.employee_id,
        item_type_id: formData.item_type_id,
        quantity: formData.quantity,
        certificate_id: formData.certificate_id,
        wear_time_override: formData.wear_time_override,
        signature_path: formData.signature_path,
        notes: formData.notes
      });
    }
    setFormData({ employee_id: '', item_type_id: '', quantity: 1, certificate_id: '', wear_time_override: '', signature_path: '', notes: '' });
    setCertificates([]);
    fetchRecords();
  };

  const handleSiteChange = async (siteId) => {
    setSelectedSite(siteId);
    if (siteId) {
      const empRes = await axios.get(`/api/employees?site_id=${siteId}&status=active`);
      setEmployees(empRes.data);
    }
  };

  return (
    <div>
      <div className="card">
        <h2 style={{ color: 'var(--primary)', marginBottom: '15px' }}>Выдача спецодежды и СИЗ</h2>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ marginRight: '15px' }}>
            <input 
              type="radio" 
              checked={!isGroup} 
              onChange={() => setIsGroup(false)}
            /> Одиночная выдача
          </label>
          <label>
            <input 
              type="radio" 
              checked={isGroup} 
              onChange={() => setIsGroup(true)}
            /> Групповая выдача (всем сотрудникам объекта)
          </label>
        </div>

        {isGroup && (
          <div className="form-group">
            <label>Объект *</label>
            <select 
              className="form-control"
              value={selectedSite}
              onChange={(e) => handleSiteChange(e.target.value)}
              required
            >
              <option value="">Выберите объект...</option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {!isGroup && (
            <div className="form-group">
              <label>Сотрудник *</label>
              <select 
                className="form-control"
                value={formData.employee_id}
                onChange={(e) => setFormData({...formData, employee_id: e.target.value})}
                required
              >
                <option value="">Выберите...</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>{emp.full_name} ({emp.position})</option>
                ))}
              </select>
            </div>
          )}
          <div className="form-group">
            <label>Наименование *</label>
            <select 
              className="form-control"
              value={formData.item_type_id}
              onChange={(e) => handleItemChange(e.target.value)}
              required
            >
              <option value="">Выберите...</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Количество</label>
            <input 
              type="number" 
              className="form-control"
              value={formData.quantity}
              onChange={(e) => setFormData({...formData, quantity: e.target.value})}
            />
          </div>
          <div className="form-group">
            <label>Срок носки (мес.) — оставьте пустым для значения по умолчанию</label>
            <input 
              type="number" 
              className="form-control"
              placeholder="Автоматически из нормы"
              value={formData.wear_time_override}
              onChange={(e) => setFormData({...formData, wear_time_override: e.target.value})}
            />
          </div>
          {certificates.length > 0 && (
            <div className="form-group">
              <label>Сертификат</label>
              <select 
                className="form-control"
                value={formData.certificate_id}
                onChange={(e) => setFormData({...formData, certificate_id: e.target.value})}
              >
                <option value="">Выберите...</option>
                {certificates.map((cert) => (
                  <option key={cert.id} value={cert.id}>
                    {cert.certificate_number} (до {new Date(cert.expiry_date).toLocaleDateString()})
                  </option>
                ))}
              </select>
            </div>
          )}
          {!isGroup && (
            <div className="form-group">
              <label>Подпись сотрудника (путь к файлу)</label>
              <input 
                type="text" 
                className="form-control"
                placeholder="/signatures/emp_123.png"
                value={formData.signature_path}
                onChange={(e) => setFormData({...formData, signature_path: e.target.value})}
              />
            </div>
          )}
          <div className="form-group">
            <label>Примечание</label>
            <textarea 
              className="form-control"
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
            />
          </div>
          <button type="submit" className="btn">
            {isGroup ? `Выдать всем сотрудникам объекта (${selectedSite ? sites.find(s => s.id == selectedSite)?.name : 'объект не выбран'})` : 'Выдать'}
          </button>
        </form>
      </div>

      <div className="card">
        <h3 style={{ color: 'var(--primary)', marginBottom: '15px' }}>Последние выдачи</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Дата</th>
              <th>Сотрудник</th>
              <th>Наименование</th>
              <th>Кол-во</th>
              <th>Срок годности</th>
              <th>Статус</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.id}>
                <td>{new Date(record.issue_date).toLocaleDateString()}</td>
                <td>{record.full_name}</td>
                <td>{record.item_type_name}</td>
                <td>{record.quantity}</td>
                <td>{record.expiry_date ? new Date(record.expiry_date).toLocaleDateString() : '-'}</td>
                <td>
                  {record.status === 'issued' ? (
                    <span className="badge badge-success">Выдано</span>
                  ) : record.status === 'disposed' ? (
                    <span className="badge badge-danger">Списано</span>
                  ) : record.status === 'returned' ? (
                    <span className="badge badge-info">Возвращено</span>
                  ) : (
                    <span className="badge">{record.status}</span>
                  )}
                </td>
                <td>
                  {record.status === 'issued' && (
                    <button 
                      className="btn btn-danger" 
                      style={{ padding: '5px 10px', fontSize: '12px' }}
                      onClick={async () => {
                        if (window.confirm(`Списать "${record.item_type_name}"?`)) {
                          await axios.patch(`/api/issues/${record.id}/dispose`);
                          fetchRecords();
                        }
                      }}
                    >
                      Списать
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}