import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

export default function EmployeeCard() {
  const { id } = useParams();
  const [employee, setEmployee] = useState(null);

  useEffect(() => {
    fetchEmployee();
  }, [id]);

  const fetchEmployee = async () => {
    const res = await axios.get(`/api/employees/${id}`);
    setEmployee(res.data);
  };

  if (!employee) return <div className="card">Загрузка...</div>;

  return (
    <div>
      <div className="card">
        <h2 style={{ color: 'var(--primary)', marginBottom: '15px' }}>{employee.full_name}</h2>
        <p><strong>Табельный номер:</strong> {employee.personnel_number || '-'}</p>
        <p><strong>Должность:</strong> {employee.position}</p>
        <p><strong>Объект:</strong> {employee.site_name || '-'}</p>
        <p><strong>Дата приёма:</strong> {employee.hire_date}</p>
        <p><strong>Дата изменения профессии/подразделения:</strong> {employee.position_change_date || '-'}</p>
        <p><strong>Пол:</strong> {employee.gender === 'male' ? 'Мужской' : employee.gender === 'female' ? 'Женский' : employee.gender || '-'}</p>
        <p><strong>Рост:</strong> {employee.height || '-'} см</p>
        <p><strong>Размер одежды:</strong> {employee.clothing_size || '-'}</p>
        <p><strong>Размер обуви:</strong> {employee.shoe_size || '-'}</p>
        <p><strong>Размер головного убора:</strong> {employee.hat_size || '-'}</p>
        <p><strong>Размер СИЗОД:</strong> {employee.respirator_size || '-'}</p>
        <p><strong>Размер СИЗ рук:</strong> {employee.gloves_size || '-'}</p>
        <p><strong>Статус:</strong> {employee.status === 'active' ? 'Работает' : 'Уволен'}</p>
      </div>

      <div className="card">
        <h3 style={{ color: 'var(--primary)', marginBottom: '15px' }}>Экспорт документов</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button className="btn" onClick={() => window.open(`/api/export/employee-card/${employee.id}`, '_blank')}>Личная карточка СИЗ (Word)</button>
          <button className="btn btn-secondary" onClick={() => window.open(`/api/export/consumables/${employee.id}?period=first`, '_blank')}>Ведомость расходников I полугодие</button>
          <button className="btn btn-secondary" onClick={() => window.open(`/api/export/consumables/${employee.id}?period=second`, '_blank')}>Ведомость расходников II полугодие</button>
        </div>
      </div>

      <div className="card">
        <h3 style={{ color: 'var(--primary)', marginBottom: '15px' }}>Нормы выдачи</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Наименование</th>
              <th>Периодичность</th>
              <th>Кол-во</th>
            </tr>
          </thead>
          <tbody>
            {employee.norms?.map((norm) => (
              <tr key={norm.id}>
                <td>{norm.item_type_name}</td>
                <td>{norm.period_months} мес</td>
                <td>{norm.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3 style={{ color: 'var(--primary)', marginBottom: '15px' }}>История выдач</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Дата</th>
              <th>Наименование</th>
              <th>Кол-во</th>
              <th>Срок годности</th>
              <th>Статус</th>
            </tr>
          </thead>
          <tbody>
            {employee.history?.map((record) => (
              <tr key={record.id}>
                <td>{new Date(record.issue_date).toLocaleDateString()}</td>
                <td>{record.item_type_name}</td>
                <td>{record.quantity}</td>
                <td>{record.expiry_date ? new Date(record.expiry_date).toLocaleDateString() : '-'}</td>
                <td>{record.status === 'issued' ? 'Выдано' : 'Списано'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}