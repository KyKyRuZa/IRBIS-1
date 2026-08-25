import { Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect, Suspense, lazy } from 'react';
import { useAuth } from '@hooks/useAuth.js';
import Header from '@components/Header.jsx';
import LoadingSpinner from '@components/ui/LoadingSpinner.jsx';
import ErrorBoundary from '@components/ErrorBoundary.jsx';
import './index.css';
import styles from './App.module.css';

const EmployeeList = lazy(() => import('@features/employees/pages/EmployeeList.jsx'));
const EmployeeCard = lazy(() => import('@features/employees/pages/EmployeeCard.jsx'));
const ItemCatalog = lazy(() => import('@features/items/pages/ItemCatalog.jsx'));
const IssueNorms = lazy(() => import('@features/issues/pages/IssueNorms.jsx'));
const IssueForm = lazy(() => import('@features/issues/pages/IssueForm.jsx'));
const Certificates = lazy(() => import('@features/certificates/pages/Certificates.jsx'));
const Reports = lazy(() => import('@features/reports/pages/Reports.jsx'));
const SitesPage = lazy(() => import('@features/sites/pages/SitesPage.jsx'));
const Login = lazy(() => import('@features/auth/pages/Login.jsx'));
const FormTracker = lazy(() => import('@features/forms/pages/FormTracker.jsx'));
const DesignSystem = lazy(() => import('@/dev/DesignSystem.jsx'));
const NotFoundPage = lazy(() => import('@pages/NotFoundPage.jsx'));

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function getPageClass(pathname) {
  if (pathname === '/login') return 'page-login';
  if (pathname.startsWith('/employees')) return 'page-employee-card';
  if (pathname === '/objects') return 'page-sites';
  if (pathname === '/items') return 'page-items';
  if (pathname === '/norms') return 'page-norms';
  if (pathname === '/issue') return 'page-issue';
  if (pathname === '/certificates') return 'page-certificates';
  if (pathname === '/reports') return 'page-reports';
  if (pathname === '/forms') return 'page-forms';
  return 'page-employees';
}

function AppContent() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const pageClass = getPageClass(location.pathname);
  const hideChrome = location.pathname === '/dev/design-system';

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(console.error);
    }
  }, []);

  return (
    <>
      {!hideChrome && <Header />}
      <main className={`${styles.container} ${pageClass}`}>
        <ErrorBoundary>
          <Suspense fallback={<LoadingSpinner size={48} />}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<ProtectedRoute><EmployeeList /></ProtectedRoute>} />
              <Route path="/objects" element={<ProtectedRoute><SitesPage /></ProtectedRoute>} />
              <Route path="/employees/:id" element={<ProtectedRoute><EmployeeCard /></ProtectedRoute>} />
              <Route path="/items" element={<ProtectedRoute><ItemCatalog /></ProtectedRoute>} />
              <Route path="/norms" element={<ProtectedRoute><IssueNorms /></ProtectedRoute>} />
              <Route path="/issue" element={<ProtectedRoute><IssueForm /></ProtectedRoute>} />
              <Route path="/certificates" element={<ProtectedRoute><Certificates /></ProtectedRoute>} />
              <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
              {user?.role === 'admin' && <Route path="/forms" element={<ProtectedRoute><FormTracker /></ProtectedRoute>} />}
                {import.meta.env.DEV && <Route path="/dev/design-system" element={<DesignSystem />} />}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>
    </>
  );
}

export default function App() {
  return <AppContent />;
}
