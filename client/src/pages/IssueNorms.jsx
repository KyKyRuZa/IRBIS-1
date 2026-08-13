import { useState, useEffect } from 'react';
import axios from 'axios';

const categories = {
  clothing: 'Спецодежда',
  footwear: 'Обувь',
  siz: 'СИЗ',
  consumable: 'Расходники'
};

export default function IssueNorms() {
  const [norms, setNorms] = useState([]);
  const [items, setItems] = useState([]);
  const [sites, setSites] = useState([]);
  const [formData, setFormData] = useState({
    item_type_id: '',
    period_months: '',
    quantity: 1,
    gender: '',
    position: '',
    site_id: ''
  });

  useEffect(() => {
    fetchNorms();
    fetchItems();
    fetchSites();
  }, []);

  const fetchNorms = async () => {
    const res = await axios.get('/api/norms');
    setNorms(res.data);
  };

  const fetchItems = async () => {
    const res = await axios.get('/api/items');
    setItems(res.data);
  };

  const fetchSites = async () => {
    const res = await axios.get('/api/sites');
    setSites(res.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await axios.post('/api/norms', formData);
    setFormData({ item_type_id: '', period_months: '', quantity: 1, gender: '', position: '', site_id: '' });
    fetchNorms();
  };

  return (
    <div className="card">
      <h2 style={{ color: 'var(--primary)', marginBottom: '15px' }}>Нормы выдачи</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Наименование *</label>
          <select 
            className="form-control"
            value={formData.item_type_id}
            onChange={(e) => setFormData({...formData, item_type_id: e.target.value})}
            required
          >
            <option value="">Выберите...</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} ({categories[item.category]})
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Периодичность (месяцы) *</label>
          <input 
            type="number" 
            className="form-control"
            value={formData.period_months}
            onChange={(e) => setFormData({...formData, period_months: e.target.value})}
            required
          />
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
        <button type="submit" className="btn">Добавить норму</button>
      </form>

      <table className="table" style={{ marginTop: '20px' }}>
        <thead>
          <tr>
            <th>Наименование</th>
            <th>Периодичность</th>
            <th>Кол-во</th>
          </tr>
        </thead>
        <tbody>
          {norms.map((norm) => (
            <tr key={norm.id}>
              <td>{norm.item_type_name}</td>
              <td>{norm.period_months} мес</td>
              <td>{norm.quantity}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}