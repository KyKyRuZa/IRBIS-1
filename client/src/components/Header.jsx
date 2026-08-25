import { useState, useCallback, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { usePushNotifications } from '@hooks/usePushNotifications.js';
import { useAuth } from '@hooks/useAuth.js';
import Icon from '@components/ui/Icon.jsx';
import styles from './Header.module.css';

// Список навигационных ссылок для всех пользователей
const NAV_LINKS = [
  { to: '/', label: 'Сотрудники' },
  { to: '/objects', label: 'Объекты' },
  { to: '/items', label: 'Номенклатура' },
  { to: '/norms', label: 'Нормы выдачи' },
  { to: '/issue', label: 'Выдача' },
  { to: '/certificates', label: 'Сертификаты' },
  { to: '/reports', label: 'Отчёты' },
];

// Ссылки, доступные только администратору
const ADMIN_LINKS = [{ to: '/forms', label: 'Учёт форм' }];

// Компонент одной ссылки
const NavItem = ({ to, label, isActive, onClick }) => (
  <Link
    to={to}
    className={`${styles.navLink} ${isActive ? styles.active : ''}`}
    onClick={onClick}
  >
    {label}
  </Link>
);

// Блок пользователя
const UserBlock = ({ user, onLogout }) => (
  <div className={styles.userBlock}>
    <span className={styles.userInfo}>
      <Icon name="user" size={16} className={styles.userIcon} />
      {user.username} ({user.role === 'admin' ? 'Админ' : 'Пользователь'})
    </span>
    <button className={styles.logoutBtn} onClick={onLogout}>
      <Icon name="logout" size={16} />
      Выйти
    </button>
  </div>
);

// Кнопка управления уведомлениями
const NotificationToggle = ({ supported, subscribed, loading, onSubscribe, onUnsubscribe }) => {
  if (!supported) return null;
  return (
    <button
      className={`${styles.notifBtn} ${subscribed ? styles.subscribed : ''}`}
      onClick={subscribed ? onUnsubscribe : onSubscribe}
      disabled={loading}
    >
      <Icon name={subscribed ? 'bellDot' : 'bell'} size={16} />
      {loading ? 'Загрузка...' : subscribed ? 'Отключить уведомления' : 'Включить уведомления'}
    </button>
  );
};

function Header() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const {
    supported,
    subscribed,
    loading,
    subscribe,
    unsubscribe,
    error: pushError,
  } = usePushNotifications();

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const allLinks = useMemo(() => {
    const base = user?.role === 'admin' ? [...NAV_LINKS, ...ADMIN_LINKS] : NAV_LINKS;
    return base;
  }, [user?.role]);

  const handleLinkClick = useCallback(() => setIsMenuOpen(false), []);

  const handleSubscribe = useCallback(async () => {
    await subscribe();
  }, [subscribe]);

  const handleUnsubscribe = useCallback(async () => {
    await unsubscribe();
  }, [unsubscribe]);

  const handleLogout = useCallback(() => {
    logout();
  }, [logout]);

  if (location.pathname === '/login') return null;

  const actionsContent = (
    <>
      <NotificationToggle
        supported={supported}
        subscribed={subscribed}
        loading={loading}
        onSubscribe={handleSubscribe}
        onUnsubscribe={handleUnsubscribe}
      />
      {user && <UserBlock user={user} onLogout={handleLogout} />}
    </>
  );

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        {/* Логотип */}
        <Link to="/" className={styles.logoLink}>
          <img src="/logo.webp" alt="АЗС ИРБИС" className={styles.logo} />
        </Link>

        {/* Бургер-иконка (видна только на мобильных) */}
        <button
          className={styles.burger}
          onClick={() => setIsMenuOpen((prev) => !prev)}
          aria-label="Меню"
          aria-expanded={isMenuOpen}
        >
          <span className={styles.burgerLine} />
          <span className={styles.burgerLine} />
          <span className={styles.burgerLine} />
        </button>

        {/* Навигационное меню */}
        <nav className={`${styles.nav} ${isMenuOpen ? styles.navOpen : ''}`}>
          {allLinks.map((link) => (
            <NavItem
              key={link.to}
              to={link.to}
              label={link.label}
              isActive={location.pathname === link.to}
              onClick={handleLinkClick}
            />
          ))}

          {/* Уведомления и пользователь — внутри бургер-меню на мобильных */}
          <div className={styles.navActions}>
            {actionsContent}
          </div>
        </nav>

        {/* Правая часть: уведомления + пользователь (только на десктопе) */}
        <div className={styles.actions}>
          {actionsContent}
          {pushError && <span className={styles.pushError} role="alert">{pushError}</span>}
        </div>
      </div>
    </header>
  );
}

export default Header;