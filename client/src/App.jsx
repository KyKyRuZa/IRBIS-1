import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, Suspense, lazy } from 'react';
import { useAuth } from '@hooks/useAuth.js';
import LoadingSpinner from '@components/ui/LoadingSpinner.jsx';
import ErrorBoundary from '@components/ErrorBoundary.jsx';
import { Toaster } from 'react-hot-toast';
import '@styles/index.css';
import MainLayout from '@/layouts/MainLayout.jsx';

const EmployeeList = lazy(() => import('@features/employees/EmployeeList.jsx'));
const EmployeeCard = lazy(() => import('@features/employees/EmployeeCard.jsx'));
const ItemCatalog = lazy(() => import('@features/items/ItemCatalog.jsx'));
const IssueNorms = lazy(() => import('@features/issues/IssueNorms.jsx'));
const IssueForm = lazy(() => import('@features/issues/IssueForm.jsx'));
const Certificates = lazy(() => import('@features/certificates/Certificates.jsx'));
const Reports = lazy(() => import('@features/reports/Reports.jsx'));
const Object = lazy(() => import('@features/objects/Object.jsx'));
const Login = lazy(() => import('@features/auth/Login.jsx'));
const FormTracker = lazy(() => import('@features/forms/FormTracker.jsx'));
const Orders = lazy(() => import('@features/orders/Orders.jsx'));
const Notifications = lazy(() => import('@features/notifications/Notifications.jsx'));
const DesignSystem = lazy(() => import('@/dev/DesignSystem.jsx'));
const NotFoundPage = lazy(() => import('@/layouts/NotFoundPage.jsx'));

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
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
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#ffffff',
            color: '#111827',
            border: '1px solid #e5e7eb',
            borderRadius: '10px',
            padding: '14px 18px',
            fontSize: '16px',
            lineHeight: '1.4',
            boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
          },
          success: {
            iconTheme: {
              primary: '#059669',
              secondary: '#ffffff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#dc2626',
              secondary: '#ffffff',
            },
          },
        }}
      />
      <Suspense fallback={<LoadingSpinner size={48} />}>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><EmployeeList /></ProtectedRoute>} />
            <Route path="/employees/:id" element={<ProtectedRoute><EmployeeCard /></ProtectedRoute>} />
            <Route path="/objects" element={<AdminRoute><Object /></AdminRoute>} />
            <Route path="/items" element={<AdminRoute><ItemCatalog /></AdminRoute>} />
            <Route path="/norms" element={<AdminRoute><IssueNorms /></AdminRoute>} />
            <Route path="/issue" element={<ProtectedRoute><IssueForm /></ProtectedRoute>} />
            <Route path="/certificates" element={<AdminRoute><Certificates /></AdminRoute>} />
            <Route path="/reports" element={<AdminRoute><Reports /></AdminRoute>} />
            <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
            <Route path="/notifications" element={<AdminRoute><Notifications /></AdminRoute>} />
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
