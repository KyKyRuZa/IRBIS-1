import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { usePushNotifications } from '@hooks/usePushNotifications.js';
import { useAuth } from '@hooks/useAuth.js';
import { adminService } from '@/lib/services/admin.service.js';
import { pushService } from '@/lib/services/push.service.js';
import Icon from '@components/ui/Icon.jsx';
import styles from '@styles/Header.module.css';

// Базовые ссылки для всех пользователей
const USER_LINKS = [
  { to: '/', label: 'Сотрудники' },
  { to: '/issue', label: 'Выдача' },
];

// Ссылки, доступные только администратору
const ADMIN_LINKS = [
  { to: '/objects', label: 'Объекты' },
  { to: '/items', label: 'Номенклатура' },
  { to: '/norms', label: 'Нормы выдачи' },
  { to: '/certificates', label: 'Сертификаты' },
  { to: '/reports', label: 'Отчёты' },
  { to: '/forms', label: 'Учёт форм' },
];

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

// Кнопка управления push-уведомлениями
const NotificationToggle = ({ supported, subscribed, loading, onSubscribe, onUnsubscribe, onTestPush, testLoading, testMsg, testError }) => {
  if (!supported) return null;
  return (
    <div className={styles.notifToggleWrap}>
      <button
        className={`${styles.notifBtn} ${subscribed ? styles.subscribed : ''}`}
        onClick={subscribed ? onUnsubscribe : onSubscribe}
        disabled={loading}
      >
        <Icon name={subscribed ? 'bellDot' : 'bell'} size={16} />
        {loading ? 'Загрузка...' : subscribed ? 'Отключить push-уведомления' : 'Включить push-уведомления'}
      </button>
      <button
        type="button"
        className={styles.testPushBtn}
        onClick={onTestPush}
        disabled={!subscribed || testLoading}
        title={subscribed ? 'Отправить тестовое push-уведомление' : 'Сначала включите push-уведомления'}
      >
        {testLoading ? 'Отправка...' : 'Проверить push'}
      </button>
      {testMsg && (
        <span className={`${styles.testPushMsg} ${testError ? styles.testPushError : ''}`}>{testMsg}</span>
      )}
    </div>
  );
};

const NOTIFICATION_TYPE_LABELS = {
  expiring_item: 'Истекает срок',
  expired_item: 'Просрочено',
  expiring_certificate: 'Сертификат истекает',
  expired_certificate: 'Сертификат просрочен',
  reorder: 'Заказ партии',
};

const notificationTypeLabel = (type) => NOTIFICATION_TYPE_LABELS[type] || type;

// Выпадающий блок профиля: уведомления + выход
const ProfileDropdown = ({ user, notifications, unreadCount, onLogout, pushProps, onMarkAllRead, onMarkRead }) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const handleKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  return (
    <div className={styles.profileContainer} ref={containerRef}>
      <button
        type="button"
        className={styles.profileBtn}
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Icon name="user" size={16} className={styles.profileIcon} />
        <span className={styles.profileName}>{user.username}</span>
        {unreadCount > 0 && <span className={styles.profileBadge}>{unreadCount}</span>}
        <Icon name="chevronDown" size={14} className={styles.profileChevron} />
      </button>

      {open && (
        <div className={styles.dropdown} role="menu">
          <div className={styles.dropdownUser}>
            <div className={styles.dropdownName}>{user.username}</div>
            <div className={styles.dropdownRole}>
              {user.role === 'admin' ? 'Администратор' : 'Пользователь'}
            </div>
          </div>

          <div className={styles.dropdownSection}>
            <div className={styles.dropdownSectionTitle}>
              Уведомления
              {unreadCount > 0 && <span className={styles.profileBadge}>{unreadCount}</span>}
            </div>
            {notifications.length === 0 ? (
              <p className={styles.dropdownEmpty}>Нет новых уведомлений</p>
            ) : (
              <ul className={styles.dropdownNotifications}>
                {notifications.map((n) => (
                  <li
                    key={n.id}
                    className={`${styles.dropdownNotifItem} ${
                      n.severity === 'danger' ? styles.notifDanger :
                      n.severity === 'warning' ? styles.notifWarning :
                      styles.notifInfo
                    }`}
                    onClick={() => onMarkRead(n.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onMarkRead(n.id);
                      }
                    }}
                    title="Отметить прочитанным"
                  >
                    <span className={styles.dropdownNotifType}>{notificationTypeLabel(n.type)}:</span>{' '}
                    <span className={styles.dropdownNotifMsg}>{n.message}</span>
                  </li>
                ))}
              </ul>
            )}
            {unreadCount > 0 && (
              <button type="button" className={styles.dropdownMarkAll} onClick={onMarkAllRead}>
                Прочитать всё
              </button>
            )}
          </div>

          <div className={styles.dropdownDivider} />

          <div className={styles.dropdownPush}>
            <NotificationToggle {...pushProps} />
          </div>

          <button type="button" className={styles.dropdownLogout} onClick={onLogout} role="menuitem">
            <Icon name="logout" size={16} />
            Выйти
          </button>
        </div>
      )}
    </div>
  );
};

function Header() {
  const location = useLocation();
  const { user, isAdmin, logout } = useAuth();
  const {
    supported,
    subscribed,
    loading,
    subscribe,
    unsubscribe,
    error: pushError,
  } = usePushNotifications();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [pushTest, setPushTest] = useState({ loading: false, msg: '', error: false });

  useEffect(() => {
    let mounted = true;
    const loadNotifications = async () => {
      setNotifLoading(true);
      try {
        const res = await adminService.getNotifications();
        if (mounted) setNotifications(Array.isArray(res) ? res : []);
      } catch (e) {
        console.error('Failed to load notifications', e);
      } finally {
        if (mounted) setNotifLoading(false);
      }
    };
    if (user?.role === 'admin') loadNotifications();
    return () => { mounted = false; };
  }, [user]);

  const allLinks = useMemo(() => {
    const base = isAdmin ? [...USER_LINKS, ...ADMIN_LINKS] : USER_LINKS;
    return base;
  }, [isAdmin]);

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

  const unread = notifications.filter((n) => !n.read);
  const unreadCount = unread.length;

  const handleMarkRead = useCallback(async (id) => {
    try {
      await adminService.markNotificationRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch (e) {
      console.error('Failed to mark notification as read', e);
    }
  }, []);

  const handleMarkAllRead = useCallback(async () => {
    try {
      await adminService.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (e) {
      console.error('Failed to mark all notifications as read', e);
    }
  }, []);

  const handleTestPush = useCallback(async () => {
    setPushTest({ loading: true, msg: '', error: false });
    try {
      const res = await pushService.sendTest();
      setPushTest({ loading: false, msg: res.message || 'Тест отправлен', error: false });
    } catch (e) {
      const msg = e?.response?.data?.error || 'Не удалось отправить тест';
      setPushTest({ loading: false, msg, error: true });
    } finally {
      setTimeout(() => setPushTest((prev) => ({ ...prev, msg: '' })), 4000);
    }
  }, []);

  if (location.pathname === '/login') return null;

  const pushProps = {
    supported,
    subscribed,
    loading,
    onSubscribe: handleSubscribe,
    onUnsubscribe: handleUnsubscribe,
    onTestPush: handleTestPush,
    testLoading: pushTest.loading,
    testMsg: pushTest.msg,
    testError: pushTest.error,
  };

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

          {/* Профиль (уведомления + выход) — внутри бургер-меню на мобильных */}
          <div className={styles.navActions}>
            {user && (
              <ProfileDropdown
                user={user}
                notifications={unread}
                unreadCount={unreadCount}
                onLogout={handleLogout}
                pushProps={pushProps}
                onMarkAllRead={handleMarkAllRead}
                onMarkRead={handleMarkRead}
              />
            )}
          </div>
        </nav>

        {/* Правая часть: профиль (только на десктопе) */}
        <div className={styles.actions}>
          {user && (
            <ProfileDropdown
              user={user}
              notifications={unread}
              unreadCount={unreadCount}
              onLogout={handleLogout}
              pushProps={pushProps}
              onMarkAllRead={handleMarkAllRead}
              onMarkRead={handleMarkRead}
            />
          )}
          {notifLoading && <span className={styles.pushError}>Загрузка уведомлений...</span>}
          {pushError && <span className={styles.pushError} role="alert">{pushError}</span>}
        </div>
      </div>
    </header>
  );
}

export default Header;