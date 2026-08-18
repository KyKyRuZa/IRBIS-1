import { Link, useLocation } from 'react-router-dom';
import { usePushNotifications } from '@hooks/usePushNotifications.js';
import { useAuth } from '@hooks/useAuth.js';

function Header() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { supported, subscribed, loading, subscribe, unsubscribe } = usePushNotifications();

  if (location.pathname === '/login') return null;

  return (
    <nav className="navbar">
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/" className="logo">
          <img src="/logo.webp" alt="АЗС ИРБИС" style={{ height: '48px', width: 'auto' }} />
        </Link>
        <div className="nav-links">
          <Link to="/">Сотрудники</Link>
          <Link to="/sites">Объекты</Link>
          <Link to="/items">Номенклатура</Link>
          <Link to="/norms">Нормы выдачи</Link>
          <Link to="/issue">Выдача</Link>
          <Link to="/certificates">Сертификаты</Link>
          <Link to="/reports">Отчёты</Link>
          {user?.role === 'admin' && <Link to="/forms">Учёт ф орм</Link>}
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
  );
}

export default Header;
