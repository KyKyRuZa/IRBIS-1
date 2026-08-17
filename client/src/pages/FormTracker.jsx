import { useState, useEffect } from 'react';
import axios from 'axios';

export default function FormTracker() {
  const [forms, setForms] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedForm, setSelectedForm] = useState('');
  const [records, setRecords] = useState([]);

  useEffect(() => {
    fetchForms();
    fetchEmployees();
    fetchRecords();
  }, []);

  const fetchForms = async () => {
    const res = await axios.get('/api/forms');
    setForms(res.data);
  };

  const fetchEmployees = async () => {
    const res = await axios.get('/api/employees');
    setEmployees(res.data);
  };

  const fetchRecords = async () => {
    const res = await axios.get('/api/forms/taken');
    setRecords(res.data);
  };

  const handleAddForm = async (e) => {
    e.preventDefault();
    if (!formName) return;
    await axios.post('/api/forms', { name: formName, description: formDesc });
    setFormName('');
    setFormDesc('');
    fetchForms();
  };

  const handleTakeForm = async (e) => {
    e.preventDefault();
    if (!selectedEmployee || !selectedForm) return;
    await axios.post('/api/forms/take', {
      employee_id: selectedEmployee,
      form_id: selectedForm
    });
    setSelectedEmployee('');
    setSelectedForm('');
    fetchRecords();
  };

  return (
    <div className="page-wrapper page-forms">
      <div className="page-header">
        <div className="container">
          <div>
            <h1>Учёт форм</h1>
            <div className="page-subtitle">Административная панель учёта бланков и документов</div>
          </div>
        </div>
      </div>
      <div className="container" style={{ padding: '20px' }}>
        <div className="card">
          <h2 style={{ color: 'var(--primary)', marginBottom: '15px' }}>Добавить форму</h2>
          <form onSubmit={handleAddForm} style={{ marginBottom: '20px' }}>
            <div className="form-group">
              <label>Название формы</label>
              <input
                type="text"
                className="form-control"
                placeholder="Название формы"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Описание</label>
              <input
                type="text"
                className="form-control"
                placeholder="Описание"
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
              />
            </div>
            <button type="submit" className="btn">Добавить форму</button>
          </form>
        </div>

        <div className="card">
          <h2 style={{ color: 'var(--primary)', marginBottom: '15px' }}>Отметить форму взятой</h2>
          <form onSubmit={handleTakeForm} style={{ marginBottom: '20px' }}>
            <div className="form-group">
              <label>Сотрудник</label>
              <select
                className="form-control"
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                required
              >
                <option value="">Выберите сотрудника</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.full_name} ({emp.position})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Форма</label>
              <select
                className="form-control"
                value={selectedForm}
                onChange={(e) => setSelectedForm(e.target.value)}
                required
              >
                <option value="">Выберите форму</option>
                {forms.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn">Отметить</button>
          </form>
        </div>

        <div className="card">
          <h2 style={{ color: 'var(--primary)', marginBottom: '15px' }}>История взятия форм</h2>
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Сотрудник (ФИО)</th>
                <th>Должность</th>
                <th>Форма</th>
                <th>Дата</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td>{r.full_name}</td>
                  <td>{r.position}</td>
                  <td>{r.form_name}</td>
                  <td>{new Date(r.taken_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}