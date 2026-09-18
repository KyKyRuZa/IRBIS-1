import { useState, useCallback, useMemo, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth.js';
import Icon from '@components/ui/Icon.jsx';
import styles from '@styles/Sidebar.module.css';

// ВАШИ ОРИГИНАЛЬНЫЕ ССЫЛКИ
const USER_LINKS = [
  { to: '/', label: 'Сотрудники', icon: 'users' },
  { to: '/issue', label: 'Выдача', icon: 'issue' },
];

const ADMIN_LINKS = [
  { to: '/objects', label: 'Объекты', icon: 'objects' },
  { to: '/items', label: 'Номенклатура', icon: 'items' },
  { to: '/norms', label: 'Нормы выдачи', icon: 'norms' },
  { to: '/certificates', label: 'Сертификаты', icon: 'certificates' },
  { to: '/forms', label: 'Учёт форм', icon: 'forms' },
  { to: '/reports', label: 'Аналитика', icon: 'reports' }
];

function NavItem({ to, label, icon, isActive, collapsed, onClick }) {
  return (
    <Link
      to={to}
      className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
      onClick={onClick}
      data-label={label}
    >
      <div className={styles.navIconWrap}>
        <Icon name={icon} size={20} className={styles.navItemIcon} />
      </div>
      <span className={styles.navItemLabel}>{label}</span>
    </Link>
  );
}

function Sidebar({ collapsed, onToggleCollapse }) {
  const location = useLocation();
  const { user, isAdmin, logout } = useAuth();

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // Формируем список ссылок в зависимости от роли
  const allLinks = useMemo(() => {
    const base = isAdmin ? [...USER_LINKS, ...ADMIN_LINKS] : USER_LINKS;
    return base;
  }, [isAdmin]);

  const handleLinkClick = useCallback(() => {
    setIsMobileOpen(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const fetchNotifications = async () => {
      try {
        const { adminService } = await import('@/lib/services/admin.service.js');
        const data = await adminService.getNotifications();
        if (!cancelled) setNotifications(Array.isArray(data) ? data : []);
      } catch {
        // ignore
      }
    };
    fetchNotifications();
    const intervalId = setInterval(fetchNotifications, 30000);
    const handleFocus = () => { fetchNotifications(); };
    window.addEventListener('focus', handleFocus);
    return () => {
      cancelled = true;
      clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter(n => !n.read).length,
    [notifications]
  );

  return (
    <>
      <aside
        className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ''} ${isMobileOpen ? styles.sidebarOpen : ''}`}
        aria-label="Основная навигация"
      >
        <div className={styles.sidebarInner}>

          {/* Header: Logo + Toggle */}
          <div className={styles.header}>
            <Link to="/" className={styles.brand} onClick={handleLinkClick}>
              <div className={styles.brandIconWrap}>
                <img src="/icon.svg" alt="IRBIS" className={styles.brandImage} />
              </div>
              <span className={styles.brandText}>IRBIS</span>
            </Link>
            <button
              className={styles.collapseBtn}
              onClick={onToggleCollapse}
              title={collapsed ? 'Развернуть' : 'Свернуть'}
            >
              <Icon name={collapsed ? 'chevronRight' : 'chevronLeft'} size={18} />
            </button>
          </div>

          {/* Notifications quick link */}
          {isAdmin && (
            <Link to="/notifications" className={styles.quickLink} onClick={handleLinkClick} data-label="Уведомления">
              <div className={styles.quickLinkLeft}>
                <Icon name={unreadCount > 0 ? 'bellDot' : 'bell'} size={20} />
                <span>Уведомления</span>
              </div>
              {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
            </Link>
          )}

          <div className={styles.divider} />

          {/* Main Menu - ВАШИ ССЫЛКИ */}
          <div className={styles.menuSection}>
            <div className={styles.sectionTitle}>Меню</div>
            <nav className={styles.nav}>
              {allLinks.map((link) => (
                <NavItem
                  key={link.to}
                  to={link.to}
                  label={link.label}
                  icon={link.icon}
                  isActive={location.pathname === link.to}
                  collapsed={collapsed}
                  onClick={handleLinkClick}
                />
              ))}
            </nav>
          </div>

          <div className={styles.spacer} />

          {/* User Profile */}
          <div className={styles.userProfile} onClick={logout} title="Выйти">
            <div className={styles.userAvatar}>
               <Icon name="user" size={20} />
            </div>
            <div className={styles.userInfo}>
              <div className={styles.userName}>{user?.username || 'Пользователь'}</div>
              <div className={styles.userRole}>{isAdmin ? 'Администратор' : 'Сотрудник'}</div>
            </div>
            <Icon name="logout" size={16} className={styles.userChevron} />
          </div>

        </div>
      </aside>

      {isMobileOpen && <div className={styles.backdrop} onClick={() => setIsMobileOpen(false)} />}

      <button
        type="button"
        className={`${styles.mobileTrigger} ${isMobileOpen ? styles.mobileTriggerHidden : ''}`}
        onClick={() => setIsMobileOpen(true)}
        aria-label="Открыть меню"
      >
        <span className={styles.burgerLine} />
        <span className={styles.burgerLine} />
        <span className={styles.burgerLine} />
      </button>
    </>
  );
}

export default Sidebar;
