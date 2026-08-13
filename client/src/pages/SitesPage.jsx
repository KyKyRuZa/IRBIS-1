import { useState, useEffect } from 'react';
import axios from 'axios';

export default function SitesPage() {
  const [sites, setSites] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    responsible_person: ''
  });

  useEffect(() => {
    fetchSites();
  }, []);

  const fetchSites = async () => {
    const res = await axios.get('/api/sites');
    setSites(res.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await axios.post('/api/sites', formData);
    setFormData({ name: '', responsible_person: '' });
    fetchSites();
  };

  return (
    <div className="card">
      <h2 style={{ color: 'var(--primary)', marginBottom: '15px' }}>Объекты</h2>
      
      <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
        <div className="form-group">
          <label>Название объекта *</label>
          <input 
            type="text" 
            className="form-control"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            required
          />
        </div>
        <div className="form-group">
          <label>Ответственный</label>
          <input 
            type="text" 
            className="form-control"
            value={formData.responsible_person}
            onChange={(e) => setFormData({...formData, responsible_person: e.target.value})}
          />
        </div>
        <button type="submit" className="btn">Добавить объект</button>
      </form>

      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Название</th>
            <th>Ответственный</th>
          </tr>
        </thead>
        <tbody>
          {sites.map((s) => (
            <tr key={s.id}>
              <td>{s.id}</td>
              <td>{s.name}</td>
              <td>{s.responsible_person}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}