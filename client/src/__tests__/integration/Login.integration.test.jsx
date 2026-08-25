import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '@contexts/AuthContext.jsx';
import Login from '@features/auth/Login.jsx';
import { authService } from '@/lib/services/auth.service.js';

vi.mock('@/lib/services/auth.service.js', () => {
  const authService = {
    login: vi.fn(),
    register: vi.fn(),
    changePassword: vi.fn(),
    me: vi.fn().mockResolvedValue(null),
    logout: vi.fn(),
  };
  return { authService };
});

function renderLogin() {
  localStorage.clear();
  return render(
    <AuthProvider>
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Login />
      </MemoryRouter>
    </AuthProvider>
  );
}

describe('Login (integration)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('logs in, stores the token and calls the API with credentials', async () => {
    authService.login.mockResolvedValue({ username: 'admin', role: 'admin' });
    renderLogin();

    fireEvent.change(screen.getByLabelText('Логин'), { target: { value: 'admin' } });
    fireEvent.change(screen.getByLabelText('Пароль'), { target: { value: 'secret' } });
    fireEvent.click(screen.getByRole('button', { name: 'Войти' }));

    await waitFor(() => expect(authService.login).toHaveBeenCalledWith('admin', 'secret'));
    expect(JSON.parse(localStorage.getItem('user')).username).toBe('admin');
  });

  it('shows an error message when login fails', async () => {
    authService.login.mockRejectedValue({ response: { data: { error: 'Неверный логин' } } });
    renderLogin();

    fireEvent.change(screen.getByLabelText('Логин'), { target: { value: 'admin' } });
    fireEvent.change(screen.getByLabelText('Пароль'), { target: { value: 'bad' } });
    fireEvent.click(screen.getByRole('button', { name: 'Войти' }));

    expect(await screen.findByText('Неверный логин')).toBeInTheDocument();
  });

  it('defaults to an error message when the response has no detail', async () => {
    authService.login.mockRejectedValue(new Error('network'));
    renderLogin();

    fireEvent.change(screen.getByLabelText('Логин'), { target: { value: 'admin' } });
    fireEvent.change(screen.getByLabelText('Пароль'), { target: { value: 'bad' } });
    fireEvent.click(screen.getByRole('button', { name: 'Войти' }));

    expect(await screen.findByText('Ошибка входа. Проверьте данные.')).toBeInTheDocument();
  });
});
