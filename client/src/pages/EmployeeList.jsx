import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

export default function EmployeeList() {
  const [employees, setEmployees] = useState([]);
  const [sites, setSites] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    position: '',
    site_id: '',
    gender: '',
    hire_date: '',
    clothing_size: '',
    shoe_size: '',
    personnel_number: '',
    hat_size: '',
    respirator_size: '',
    gloves_size: '',
    position_change_date: ''
  });

  useEffect(() => {
    fetchEmployees();
    fetchSites();
  }, []);

  const fetchEmployees = async () => {
    const res = await axios.get('/api/employees');
    setEmployees(res.data);
  };

  const fetchSites = async () => {
    const res = await axios.get('/api/sites');
    setSites(res.data);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    const res = await axios.get(`/api/employees?search=${search}`);
    setEmployees(res.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await axios.post('/api/employees', formData);
    setFormData({ full_name: '', position: '', site_id: '', gender: '', hire_date: '', clothing_size: '', shoe_size: '', personnel_number: '', hat_size: '', respirator_size: '', gloves_size: '', position_change_date: '' });
    setShowForm(false);
    fetchEmployees();
  };

  return (
    <div>
      <div className="card">
        <h1 style={{ color: 'var(--primary)', marginBottom: '20px' }}>Справочник сотрудников</h1>
        
        <form className="search-box" onSubmit={handleSearch}>
          <input 
            type="text" 
            placeholder="Поиск по ФИО..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="btn">Найти</button>
          <button type="button" className="btn" onClick={() => setShowForm(!showForm)} style={{ marginLeft: '10px' }}>
            {showForm ? 'Свернуть' : 'Добавить сотрудника'}
          </button>
        </form>

        {showForm && (
          <form onSubmit={handleSubmit} style={{ marginTop: '20px', padding: '15px', background: '#f9f9f9', borderRadius: '8px' }}>
            <div className="form-group">
              <label>ФИО *</label>
              <input 
                type="text" 
                className="form-control"
                value={formData.full_name}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Должность *</label>
              <input 
                type="text" 
                className="form-control"
                value={formData.position}
                onChange={(e) => setFormData({...formData, position: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Объект</label>
              <select 
                className="form-control"
                value={formData.site_id}
                onChange={(e) => setFormData({...formData, site_id: e.target.value})}
              >
                <option value="">Выберите объект</option>
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Размер одежды</label>
              <input 
                type="text" 
                className="form-control"
                value={formData.clothing_size}
                onChange={(e) => setFormData({...formData, clothing_size: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>Размер обуви</label>
              <input 
                type="text" 
                className="form-control"
                value={formData.shoe_size}
                onChange={(e) => setFormData({...formData, shoe_size: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>Табельный номер</label>
              <input 
                type="text" 
                className="form-control"
                value={formData.personnel_number}
                onChange={(e) => setFormData({...formData, personnel_number: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>Рост</label>
              <input 
                type="number" 
                className="form-control"
                value={formData.height}
                onChange={(e) => setFormData({...formData, height: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>Размер головного убора</label>
              <input 
                type="text" 
                className="form-control"
                value={formData.hat_size}
                onChange={(e) => setFormData({...formData, hat_size: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>Размер СИЗОД (дыхания)</label>
              <input 
                type="text" 
                className="form-control"
                value={formData.respirator_size}
                onChange={(e) => setFormData({...formData, respirator_size: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>Размер СИЗ рук</label>
              <input 
                type="text" 
                className="form-control"
                value={formData.gloves_size}
                onChange={(e) => setFormData({...formData, gloves_size: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>Дата изменения профессии/подразделения</label>
              <input 
                type="date" 
                className="form-control"
                value={formData.position_change_date}
                onChange={(e) => setFormData({...formData, position_change_date: e.target.value})}
              />
            </div>
            <button type="submit" className="btn">Сохранить</button>
          </form>
        )}
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>ФИО</th>
              <th>Табельный №</th>
              <th>Должность</th>
              <th>Объект</th>
              <th>Размеры</th>
              <th>Статус</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <tr key={emp.id}>
                <td>{emp.id}</td>
                <td>{emp.full_name}</td>
                <td>{emp.personnel_number || '-'}</td>
                <td>{emp.position}</td>
                <td>{emp.site_name || '-'}</td>
                <td>{emp.clothing_size} / {emp.shoe_size} / {emp.hat_size || '-'} / {emp.respirator_size || '-'} / {emp.gloves_size || '-'}</td>
                <td className={emp.status === 'active' ? 'status-active' : 'status-terminated'}>
                  {emp.status === 'active' ? 'Работает' : 'Уволен'}
                </td>
                <td>
                  <Link to={`/employees/${emp.id}`} className="btn" style={{ padding: '5px 10px', fontSize: '12px' }}>
                    Карточка
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}