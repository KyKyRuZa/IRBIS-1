import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@contexts/AuthContext.jsx';
import { useAuth } from '@hooks/useAuth.js';
import Login from '@features/auth/Login.jsx';

vi.mock('@/lib/services/auth.service.js', () => {
  const authService = { login: vi.fn(), register: vi.fn(), changePassword: vi.fn(), me: vi.fn().mockResolvedValue(null), logout: vi.fn() };
  return { authService };
});

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function renderAt(path) {
  window.history.pushState({}, '', path);
  return render(
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <div>secret content</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

describe('App routes', () => {
  beforeEach(() => localStorage.clear());

  it('redirects unauthenticated users from protected routes to the login page', async () => {
    renderAt('/');
    expect(await screen.findByText('Вход в систему')).toBeInTheDocument();
    expect(screen.queryByText('secret content')).toBeNull();
  });

  it('allows access to protected routes when authenticated', () => {
    localStorage.setItem('user', JSON.stringify({ username: 'admin', role: 'admin' }));
    renderAt('/');
    expect(screen.getByText('secret content')).toBeInTheDocument();
  });
});
