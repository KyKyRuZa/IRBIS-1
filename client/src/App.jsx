import { Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
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
import { usePushNotifications } from './hooks/usePushNotifications.js';
import './index.css';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function getPageClass(pathname) {
  if (pathname === '/login') return 'page-login';
  if (pathname.startsWith('/employees')) return 'page-employee-card';
  if (pathname === '/sites') return 'page-sites';
  if (pathname === '/items') return 'page-items';
  if (pathname === '/norms') return 'page-norms';
  if (pathname === '/issue') return 'page-issue';
  if (pathname === '/certificates') return 'page-certificates';
  if (pathname === '/reports') return 'page-reports';
  if (pathname === '/forms') return 'page-forms';
  return 'page-employees';
}

function AppContent() {
  const [user, setUser] = useState(null);
  const location = useLocation();
  const { supported, subscribed, loading, error, subscribe, unsubscribe } = usePushNotifications();
  const pageClass = getPageClass(location.pathname);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(console.error);
    }
  }, []);

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
              <img src="/logo_irbis.webp" alt="АЗС ИРБИС" style={{ height: '48px', width: 'auto' }} />
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
              {supported && user && (
                <button
                  onClick={subscribed ? unsubscribe : subscribe}
                  disabled={loading}
                  style={{ marginLeft: '10px', padding: '5px 10px', cursor: 'pointer' }}
                >
                  {loading ? '...' : subscribed ? 'Отключить уведомления' : 'Включить уведомления'}
                </button>
              )}
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
      <main className={`container ${pageClass}`}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><EmployeeList user={user} /></ProtectedRoute>} />
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