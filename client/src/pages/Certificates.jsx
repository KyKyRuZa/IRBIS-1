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
  const [certificateFile, setCertificateFile] = useState(null);
  const [uploading, setUploading] = useState(false);

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
    setUploading(true);
    try {
      if (certificateFile) {
        const fd = new FormData();
        fd.append('certificate', certificateFile);
        fd.append('product_name', formData.product_name);
        fd.append('certificate_number', formData.certificate_number || '');
        fd.append('issue_date', formData.issue_date || '');
        fd.append('expiry_date', formData.expiry_date || '');
        fd.append('item_type_id', formData.item_type_id || '');
        await axios.post('/api/upload/certificate', fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await axios.post('/api/certificates', formData);
      }
      setFormData({ product_name: '', certificate_number: '', issue_date: '', expiry_date: '', item_type_id: '' });
      setCertificateFile(null);
      fetchCertificates();
    } catch (err) {
      alert(err.response?.data?.error || 'Ошибка загрузки');
    } finally {
      setUploading(false);
    }
  };

  const filteredCerts = showExpired 
    ? certificates 
    : certificates.filter(c => c.status !== 'expired');

  return (
    <div className="page-wrapper page-certificates">
      <div className="page-header">
        <div className="container">
          <div>
            <h1>Сертификаты соответствия</h1>
            <div className="page-subtitle">Контроль сроков действия и файлов сертификатов</div>
          </div>
        </div>
      </div>
      <div className="container">
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
            <div className="form-group">
              <label>Файл сертификата (PDF/изображение)</label>
              <input 
                type="file" 
                className="form-control"
                accept=".pdf,.png,.jpg,.jpeg,.gif,.webp"
                onChange={(e) => setCertificateFile(e.target.files[0] || null)}
              />
            </div>
            <button type="submit" className="btn" disabled={uploading}>{uploading ? 'Загрузка...' : 'Добавить сертификат'}</button>
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
                <th>Файл</th>
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
                  <td>
                    {cert.file_path && (
                      <a href={cert.file_path} target="_blank" rel="noreferrer">Открыть файл</a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}