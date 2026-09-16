import { useState, useCallback } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '@components/Sidebar.jsx';
import styles from '@styles/App.module.css';

function getPageClass(pathname) {
  if (pathname === '/login') return 'page-login';
  if (pathname.startsWith('/employees')) return 'page-employees';
  if (pathname === '/objects') return 'page-sites';
  if (pathname === '/items') return 'page-items';
  if (pathname === '/norms') return 'page-norms';
  if (pathname === '/issue') return 'page-issue';
  if (pathname === '/certificates') return 'page-certificates';
  if (pathname === '/reports') return 'page-reports';
  if (pathname === '/forms') return 'page-forms';
  if (pathname === '/notifications') return 'page-notifications';
  return 'page-employees';
}

export default function MainLayout() {
  const location = useLocation();
  const pageClass = getPageClass(location.pathname);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed(prev => !prev);
  }, []);

  if (location.pathname === '/login') {
    return <Outlet />;
  }

  return (
    <div className={`${styles.layout} ${pageClass}`}>
      <Sidebar collapsed={sidebarCollapsed} onToggleCollapse={toggleSidebar} />
      <main className={`${styles.main} ${sidebarCollapsed ? styles.mainExpanded : ''}`}>
        <Outlet />
      </main>
    </div>
  );
}
