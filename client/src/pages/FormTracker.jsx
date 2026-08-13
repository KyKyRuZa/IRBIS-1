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
    <div style={{ padding: '20px' }}>
      <h1>Учёт форм (Админ панель)</h1>

      <h2>Добавить форму</h2>
      <form onSubmit={handleAddForm} style={{ marginBottom: '20px' }}>
        <div>
          <input
            type="text"
            placeholder="Название формы"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            required
          />
        </div>
        <div style={{ marginTop: '10px' }}>
          <input
            type="text"
            placeholder="Описание"
            value={formDesc}
            onChange={(e) => setFormDesc(e.target.value)}
          />
        </div>
        <button type="submit" style={{ marginTop: '10px' }}>
          Добавить форму
        </button>
      </form>

      <h2>Отметить форму взятой</h2>
      <form onSubmit={handleTakeForm} style={{ marginBottom: '20px' }}>
        <div>
          <select
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
        <div style={{ marginTop: '10px' }}>
          <select
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
        <button type="submit" style={{ marginTop: '10px' }}>
          Отметить
        </button>
      </form>

      <h2>История взятия форм</h2>
      <table border="1" cellPadding="10">
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
  );
}