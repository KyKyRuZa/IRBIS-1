import { Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import EmployeeList from './pages/EmployeeList.jsx';
import EmployeeCard from './pages/EmployeeCard.jsx';
import ItemCatalog from './pages/ItemCatalog.jsx';
import IssueNorms from './pages/IssueNorms.jsx';
import IssueForm from './pages/IssueForm.jsx';
import Certificates from './pages/Certificates.jsx';
import Reports from './pages/Reports.jsx';
import SitesPage from './pages/SitesPage.jsx';
import Login from './pages/Login.jsx';
import FormTracker from './pages/FormTracker.jsx';
import './index.css';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function AppContent() {
  const [user, setUser] = useState(null);
  const location = useLocation();

  useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) setUser(JSON.parse(stored));
    } catch (e) {
      console.error('Failed to parse user from localStorage', e);
    }
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <>
      {location.pathname !== '/login' && (
        <nav className="navbar">
          <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Link to="/" className="logo">
              <span style={{ fontSize: '28px', fontWeight: 'bold' }}>АЗС ИРБИС</span>
            </Link>
            <div className="nav-links">
              <Link to="/">Сотрудники</Link>
              <Link to="/sites">Объекты</Link>
              <Link to="/items">Номенклатура</Link>
              <Link to="/norms">Нормы выдачи</Link>
              <Link to="/issue">Выдача</Link>
              <Link to="/certificates">Сертификаты</Link>
              <Link to="/reports">Отчёты</Link>
              {user?.role === 'admin' && <Link to="/forms">Учёт форм</Link>}
              {user && (
                <span style={{ marginLeft: '15px', fontSize: '14px' }}>
                  {user.username} ({user.role === 'admin' ? 'Админ' : 'Пользователь'})
                  <button onClick={logout} style={{ marginLeft: '10px', padding: '5px 10px', cursor: 'pointer' }}>Выйти</button>
                </span>
              )}
            </div>
          </div>
        </nav>
      )}
      <main className="container">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><EmployeeList /></ProtectedRoute>} />
          <Route path="/sites" element={<ProtectedRoute><SitesPage /></ProtectedRoute>} />
          <Route path="/employees/:id" element={<ProtectedRoute><EmployeeCard /></ProtectedRoute>} />
          <Route path="/items" element={<ProtectedRoute><ItemCatalog /></ProtectedRoute>} />
          <Route path="/norms" element={<ProtectedRoute><IssueNorms /></ProtectedRoute>} />
          <Route path="/issue" element={<ProtectedRoute><IssueForm /></ProtectedRoute>} />
          <Route path="/certificates" element={<ProtectedRoute><Certificates /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
          {user?.role === 'admin' && <Route path="/forms" element={<ProtectedRoute><FormTracker /></ProtectedRoute>} />}
        </Routes>
      </main>
    </>
  );
}

export default function App() {
  return <AppContent />;
}