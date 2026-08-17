import { useState, useEffect } from 'react';
import axios from 'axios';

const categories = {
  clothing: 'Спецодежда',
  footwear: 'Обувь',
  siz: 'СИЗ',
  consumable: 'Расходники'
};

const seasonality = {
  winter: 'Зимняя',
  summer: 'Летняя',
  year_round: 'Круглогодичная'
};

export default function ItemCatalog() {
  const [items, setItems] = useState([]);
  const [category, setCategory] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [detailItem, setDetailItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'consumable',
    unit: 'шт',
    default_wear_time_months: '',
    seasonality: 'year_round',
    requires_certificate: false
  });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    const url = category ? `/api/items?category=${category}` : '/api/items';
    const res = await axios.get(url);
    setItems(res.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = { ...formData };
    if (data.default_wear_time_months === '') data.default_wear_time_months = null;
    if (editingItem) {
      await axios.put(`/api/items/${editingItem.id}`, data);
      setEditingItem(null);
    } else {
      await axios.post('/api/items', data);
    }
    setFormData({ name: '', category: 'consumable', unit: 'шт', default_wear_time_months: '', seasonality: 'year_round', requires_certificate: false });
    setShowForm(false);
    fetchItems();
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      unit: item.unit || 'шт',
      default_wear_time_months: item.default_wear_time_months || '',
      seasonality: item.seasonality || 'year_round',
      requires_certificate: item.requires_certificate || false
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Вы уверены, что хотите удалить эту позицию?')) {
      await axios.delete(`/api/items/${id}`);
      fetchItems();
      if (detailItem && detailItem.id === id) setDetailItem(null);
    }
  };

  const handleCancel = () => {
    setEditingItem(null);
    setShowForm(false);
    setFormData({ name: '', category: 'consumable', unit: 'шт', default_wear_time_months: '', seasonality: 'year_round', requires_certificate: false });
  };

  const showDetails = async (item) => {
    const [itemRes, certRes] = await Promise.all([
      axios.get(`/api/items/${item.id}`),
      axios.get(`/api/certificates/item/${item.id}`)
    ]);
    setDetailItem({ ...itemRes.data, certificates: certRes.data });
  };

  return (
    <div className="page-wrapper page-items">
      <div className="page-header">
        <div className="container">
          <div>
            <h1>Номенклатура</h1>
            <div className="page-subtitle">Справочник спецодежды, обуви и СИЗ</div>
          </div>
          <button className="btn" onClick={() => { setShowForm(!showForm); setEditingItem(null); handleCancel(); }}>
            {showForm ? 'Свернуть' : 'Добавить позицию'}
          </button>
        </div>
      </div>
      <div className="container">
        <div className="card">
          <div className="tabs">
            <button
              className={!category ? 'active' : ''}
              onClick={() => { setCategory(''); fetchItems(); }}
            >Все</button>
            {Object.entries(categories).map(([key, label]) => (
              <button
                key={key}
                className={category === key ? 'active' : ''}
                onClick={() => { setCategory(key); fetchItems(); }}
              >{label}</button>
            ))}
          </div>

          <table className="table">
            <thead>
              <tr>
                <th>Наименование</th>
                <th>Категория</th>
                <th>Срок (мес)</th>
                <th>Сезон</th>
                <th>Сертификат</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{categories[item.category]}</td>
                  <td>{item.default_wear_time_months || '-'}</td>
                  <td>{seasonality[item.seasonality] || '-'}</td>
                  <td>
                    {item.requires_certificate ? (
                      <span className="badge badge-warning">Требуется</span>
                    ) : (
                      <span className="badge badge-success">Не требуется</span>
                    )}
                  </td>
                  <td>
                    <button className="btn" style={{ padding: '5px 10px', fontSize: '12px', marginRight: '5px' }} onClick={() => showDetails(item)}>Подробнее</button>
                    <button className="btn" style={{ padding: '5px 10px', fontSize: '12px', marginRight: '5px' }} onClick={() => handleEdit(item)}>Редактировать</button>
                    <button className="btn btn-danger" style={{ padding: '5px 10px', fontSize: '12px' }} onClick={() => handleDelete(item.id)}>Удалить</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {showForm && (
          <div className="card">
            <h3 style={{ color: 'var(--primary)', marginBottom: '15px' }}>{editingItem ? 'Редактировать позицию' : 'Новая позиция'}</h3>
            <form onSubmit={handleSubmit} style={{ marginBottom: '20px', padding: '20px', background: '#f9f9f9', borderRadius: '8px' }}>
              <div className="form-group">
                <label>Наименование *</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Категория *</label>
                <select
                  className="form-control"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                >
                  {Object.entries(categories).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Единица измерения</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.unit}
                  onChange={(e) => setFormData({...formData, unit: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Срок годности (мес)</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.default_wear_time_months}
                  onChange={(e) => setFormData({...formData, default_wear_time_months: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Сезонность</label>
                <select
                  className="form-control"
                  value={formData.seasonality}
                  onChange={(e) => setFormData({...formData, seasonality: e.target.value})}
                >
                  <option value="year_round">Круглогодичная</option>
                  <option value="winter">Зимняя</option>
                  <option value="summer">Летняя</option>
                </select>
              </div>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.requires_certificate}
                    onChange={(e) => setFormData({...formData, requires_certificate: e.target.checked})}
                  /> Требуется сертификат
                </label>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" className="btn">{editingItem ? 'Сохранить' : 'Добавить'}</button>
                {editingItem && <button type="button" className="btn btn-secondary" onClick={handleCancel}>Отмена</button>}
              </div>
            </form>
          </div>
        )}

        {detailItem && (
          <div className="card">
            <h3 style={{ color: 'var(--primary)', marginBottom: '15px' }}>Подробности: {detailItem.name}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
              <div><strong>Категория:</strong> {categories[detailItem.category]}</div>
              <div><strong>Единица измерения:</strong> {detailItem.unit || '-'}</div>
              <div><strong>Срок годности:</strong> {detailItem.default_wear_time_months || '-'} мес.</div>
              <div><strong>Сезонность:</strong> {seasonality[detailItem.seasonality] || '-'}</div>
              <div><strong>Требуется сертификат:</strong> {detailItem.requires_certificate ? 'Да' : 'Нет'}</div>
            </div>

            <h4 style={{ marginBottom: '10px' }}>Сертификаты</h4>
            {detailItem.certificates && detailItem.certificates.length > 0 ? (
              <table className="table">
                <thead>
                  <tr>
                    <th>Номер</th>
                    <th>Дата выдачи</th>
                    <th>Срок действия</th>
                    <th>Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {detailItem.certificates.map((cert) => (
                    <tr key={cert.id}>
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
            ) : (
              <p>Сертификаты отсутствуют</p>
            )}
            <button className="btn btn-secondary" style={{ marginTop: '15px' }} onClick={() => setDetailItem(null)}>Закрыть</button>
          </div>
        )}
      </div>
    </div>
  );
}
