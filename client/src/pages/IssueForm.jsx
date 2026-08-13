import { useState, useEffect } from 'react';
import axios from 'axios';

export default function IssueForm() {
  const [employees, setEmployees] = useState([]);
  const [items, setItems] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [records, setRecords] = useState([]);
  const [formData, setFormData] = useState({
    employee_id: '',
    item_type_id: '',
    quantity: 1,
    certificate_id: ''
  });

  useEffect(() => {
    fetchEmployees();
    fetchItems();
    fetchRecords();
  }, []);

  const fetchEmployees = async () => {
    const res = await axios.get('/api/employees?status=active');
    setEmployees(res.data);
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
    await axios.post('/api/issues', formData);
    setFormData({ employee_id: '', item_type_id: '', quantity: 1, certificate_id: '' });
    setCertificates([]);
    fetchRecords();
  };

  return (
    <div>
      <div className="card">
        <h2 style={{ color: 'var(--primary)', marginBottom: '15px' }}>Выдача спецодежды и СИЗ</h2>
        
        <form onSubmit={handleSubmit}>
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
          <button type="submit" className="btn">Выдать</button>
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
                  ) : (
                    <span className="badge badge-danger">Списано</span>
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