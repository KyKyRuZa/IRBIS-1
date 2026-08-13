import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Reports() {
  const [records, setRecords] = useState([]);
  const [expiring, setExpiring] = useState([]);

  useEffect(() => {
    fetchRecords();
    fetchExpiring();
  }, []);

  const fetchRecords = async () => {
    const res = await axios.get('/api/issues');
    setRecords(res.data);
  };

  const fetchExpiring = async () => {
    const res = await axios.get('/api/issues/expiring?months=2');
    setExpiring(res.data);
  };

  const handleExcelExport = () => {
    window.open('/api/reports/excel', '_blank');
  };

  const handleIssuesWordExport = () => {
    window.open('/api/export/issues-report', '_blank');
  };

  const handleExpiringWordExport = () => {
    window.open('/api/export/expiring-report', '_blank');
  };

  const handleAllCardsExport = () => {
    window.open('/api/export/all-cards', '_blank');
  };

  return (
    <div>
      <div className="card">
        <h2 style={{ color: 'var(--primary)', marginBottom: '20px' }}>Отчёты</h2>
        
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <button className="btn" onClick={handleExcelExport}>Экспорт в Excel</button>
          <button className="btn" onClick={handleIssuesWordExport}>Отчёт по выдачам (Word)</button>
          <button className="btn" onClick={handleExpiringWordExport}>Отчёт по истекающим срокам (Word)</button>
          <button className="btn btn-secondary" onClick={handleAllCardsExport}>Все карточки СИЗ (Word ZIP)</button>
        </div>
      </div>

      <div className="card">
        <h3 style={{ color: 'var(--primary)', marginBottom: '15px' }}>Сводка выдач</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Сотрудник</th>
              <th>Должность</th>
              <th>Наименование</th>
              <th>Дата выдачи</th>
              <th>Срок годности</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id}>
                <td>{r.full_name}</td>
                <td>{r.position}</td>
                <td>{r.item_type_name}</td>
                <td>{new Date(r.issue_date).toLocaleDateString()}</td>
                <td>{r.expiry_date ? new Date(r.expiry_date).toLocaleDateString() : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3 style={{ color: '#d32f2f', marginBottom: '15px' }}>
          Истекающие сроки годности (в течение 2 месяцев)
        </h3>
        <table className="table">
          <thead>
            <tr>
              <th>Сотрудник</th>
              <th>Наименование</th>
              <th>Дата выдачи</th>
              <th>Срок годности</th>
            </tr>
          </thead>
          <tbody>
            {expiring.map((r) => (
              <tr key={r.id}>
                <td>{r.full_name}</td>
                <td>{r.item_type_name}</td>
                <td>{new Date(r.issue_date).toLocaleDateString()}</td>
                <td>{new Date(r.expiry_date).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
