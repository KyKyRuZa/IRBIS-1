import { Outlet, useLocation } from 'react-router-dom';
import Header from '@components/Header.jsx';
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
  return 'page-employees';
}

export default function MainLayout() {
  const location = useLocation();
  const pageClass = getPageClass(location.pathname);

  return (
    <>
      <Header />
      <main className={`${styles.container} ${pageClass}`}>
        <Outlet />
      </main>
    </>
  );
}
