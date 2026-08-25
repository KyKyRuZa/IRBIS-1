import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, Suspense, lazy } from 'react';
import { useAuth } from '@hooks/useAuth.js';
import LoadingSpinner from '@components/ui/LoadingSpinner.jsx';
import ErrorBoundary from '@components/ErrorBoundary.jsx';
import '@styles/index.css';
import MainLayout from '@/layouts/MainLayout.jsx';

const EmployeeList = lazy(() => import('@features/employees/EmployeeList.jsx'));
const EmployeeCard = lazy(() => import('@features/employees/EmployeeCard.jsx'));
const ItemCatalog = lazy(() => import('@features/items/ItemCatalog.jsx'));
const IssueNorms = lazy(() => import('@features/issues/IssueNorms.jsx'));
const IssueForm = lazy(() => import('@features/issues/IssueForm.jsx'));
const Certificates = lazy(() => import('@features/certificates/Certificates.jsx'));
const Reports = lazy(() => import('@features/reports/Reports.jsx'));
const SitesPage = lazy(() => import('@features/sites/SitesPage.jsx'));
const Login = lazy(() => import('@features/auth/Login.jsx'));
const FormTracker = lazy(() => import('@features/forms/FormTracker.jsx'));
const DesignSystem = lazy(() => import('@/dev/DesignSystem.jsx'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage.jsx'));

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function AppContent() {
  const { user, logout } = useAuth();
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(console.error);
    }
  }, []);

  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingSpinner size={48} />}>
        <Routes>
          <Route element={<MainLayout />}>
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
          </Route>
          <Route path="*" element={<NotFoundPage />} />
          {import.meta.env.DEV && <Route path="/dev/design-system" element={<DesignSystem />} />}
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}

export default function App() {
  return <AppContent />;
}
