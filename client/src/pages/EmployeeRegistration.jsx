import { useState, useEffect } from 'react';
import axios from 'axios';

export default function EmployeeRegistration() {
  const [employees, setEmployees] = useState([]);
  const [fullName, setFullName] = useState('');
  const [position, setPosition] = useState('');

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    const res = await axios.get('/api/employees');
    setEmployees(res.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName || !position) return;
    await axios.post('/api/employees', { full_name: fullName, position });
    setFullName('');
    setPosition('');
    fetchEmployees();
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Регистрация сотрудников</h1>
      <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
        <div>
          <input
            type="text"
            placeholder="ФИО"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>
        <div style={{ marginTop: '10px' }}>
          <input
            type="text"
            placeholder="Должность"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            required
          />
        </div>
        <button type="submit" style={{ marginTop: '10px' }}>
          Зарегистрировать
        </button>
      </form>

      <h2>Список сотрудников</h2>
      <table border="1" cellPadding="10">
        <thead>
          <tr>
            <th>ID</th>
            <th>ФИО</th>
            <th>Должность</th>
            <th>Дата регистрации</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((emp) => (
            <tr key={emp.id}>
              <td>{emp.id}</td>
              <td>{emp.full_name}</td>
              <td>{emp.position}</td>
              <td>{new Date(emp.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}