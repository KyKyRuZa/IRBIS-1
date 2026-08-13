import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Certificates() {
  const [certificates, setCertificates] = useState([]);
  const [items, setItems] = useState([]);
  const [showExpired, setShowExpired] = useState(false);
  const [formData, setFormData] = useState({
    product_name: '',
    certificate_number: '',
    issue_date: '',
    expiry_date: '',
    item_type_id: ''
  });

  useEffect(() => {
    fetchCertificates();
    fetchItems();
  }, []);

  const fetchCertificates = async () => {
    const res = await axios.get('/api/certificates');
    setCertificates(res.data);
  };

  const fetchItems = async () => {
    const res = await axios.get('/api/items?requires_certificate=true');
    setItems(res.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await axios.post('/api/certificates', formData);
    setFormData({ product_name: '', certificate_number: '', issue_date: '', expiry_date: '', item_type_id: '' });
    fetchCertificates();
  };

  const filteredCerts = showExpired 
    ? certificates 
    : certificates.filter(c => c.status !== 'expired');

  return (
    <div className="card">
      <h2 style={{ color: 'var(--primary)', marginBottom: '15px' }}>Сертификаты соответствия</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Продукция *</label>
          <input 
            type="text" 
            className="form-control"
            value={formData.product_name}
            onChange={(e) => setFormData({...formData, product_name: e.target.value})}
            required
          />
        </div>
        <div className="form-group">
          <label>Номер сертификата</label>
          <input 
            type="text" 
            className="form-control"
            value={formData.certificate_number}
            onChange={(e) => setFormData({...formData, certificate_number: e.target.value})}
          />
        </div>
        <div className="form-group">
          <label>Дата выдачи</label>
          <input 
            type="date" 
            className="form-control"
            value={formData.issue_date}
            onChange={(e) => setFormData({...formData, issue_date: e.target.value})}
          />
        </div>
        <div className="form-group">
          <label>Срок действия *</label>
          <input 
            type="date" 
            className="form-control"
            value={formData.expiry_date}
            onChange={(e) => setFormData({...formData, expiry_date: e.target.value})}
            required
          />
        </div>
        <div className="form-group">
          <label>Позиция номенклатуры</label>
          <select 
            className="form-control"
            value={formData.item_type_id}
            onChange={(e) => setFormData({...formData, item_type_id: e.target.value})}
          >
            <option value="">Выберите...</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn">Добавить сертификат</button>
      </form>

      <div style={{ marginTop: '20px' }}>
        <label>
          <input 
            type="checkbox" 
            checked={showExpired}
            onChange={(e) => setShowExpired(e.target.checked)}
          /> Показать просроченные
        </label>
      </div>

      <table className="table" style={{ marginTop: '15px' }}>
        <thead>
          <tr>
            <th>Продукция</th>
            <th>Номер</th>
            <th>Дата выдачи</th>
            <th>Срок действия</th>
            <th>Статус</th>
          </tr>
        </thead>
        <tbody>
          {filteredCerts.map((cert) => (
            <tr key={cert.id}>
              <td>{cert.product_name}</td>
              <td>{cert.certificate_number}</td>
              <td>{cert.issue_date}</td>
              <td>{cert.expiry_date}</td>
              <td>
                {cert.status === 'active' && <span className="badge badge-success">Активен</span>}
                {cert.status === 'expiring' && <span className="badge badge-warning">Истекает</span>}
                {cert.status === 'expired' && <span className="badge badge-danger">Просрочен</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}