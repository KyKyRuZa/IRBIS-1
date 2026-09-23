import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@components/ui/Icon.jsx';
import { authService } from '@lib/services/auth.service.js';
import { useAuth } from '@hooks/useAuth.js';
import { showError, showFieldErrors } from '@/lib/toast.js';
import { loginSchema } from '@/lib/validation/forms.js';
import styles from '@styles/Login.module.css';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    setError('');
    const result = loginSchema.safeParse({ username, password });
    if (!result.success) {
      showFieldErrors(result.error?.issues || []);
      setIsLoading(false);
      return;
    }
    try {
      const res = await authService.login(username, password);
      login({ username: res.username, role: res.role });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка входа. Проверьте данные.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.brandInner}>
        <img src="/logo.webp" alt="АЗС ИРБИС" className={styles.logo} />
        {/* <h1 className={styles.brandTitle}>АЗС ИРБИС</h1>
        <p className={styles.brandTagline}>Система учёта СИЗ и спецодежды</p> */}
      </div>

      <div className={styles.card}>
        <header className={styles.cardHeader}>
          <h2 className={styles.heading}>
            Вход в систему
          </h2>
          <p className={styles.cardSubtitle}>
            Введите логин и пароль для входа
          </p>
        </header>

        {error && (
          <div className={styles.error} role="alert">
            <Icon name="alertTriangle" size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={`form-group ${styles.field}`}>
            <label htmlFor="username">Логин</label>
            <input
              id="username"
              name="username"
              type="text"
              className="form-control"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck="false"
              required
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'login-error' : undefined}
            />
          </div>

          <div className={`form-group ${styles.field}`}>
            <label htmlFor="password">Пароль</label>
            <div className={styles.passwordWrap}>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                className={`form-control ${styles.passwordInput}`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                aria-invalid={Boolean(error)}
              />
              <button
                type="button"
                className={styles.togglePassword}
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                aria-pressed={showPassword}
              >
                <Icon name={showPassword ? 'eyeOff' : 'eye'} size={18} />
              </button>
            </div>
          </div>

          <button
            type="submit"
            className={`btn ${styles.submitButton}`}
            disabled={isLoading}
          >
            {isLoading && <span className={styles.spinner} aria-hidden="true" />}
            {isLoading
              ? 'Подождите…'
              : 'Войти'}
          </button>
        </form>
      </div>
    </div>
  );
}
