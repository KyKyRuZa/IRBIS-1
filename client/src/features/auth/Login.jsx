import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { authService } from '@lib/services/auth.service.js';
import { useAuth } from '@hooks/useAuth.js';
import styles from '@styles/Login.module.css';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isRegister, setIsRegister] = useState(false);
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
    try {
      if (isRegister) {
        await authService.register(username, password, 'admin');
        const res = await authService.login(username, password);
        login(res.token, { username: res.username, role: res.role });
      } else {
        const res = await authService.login(username, password);
        login(res.token, { username: res.username, role: res.role });
      }
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка входа. Проверьте данные.');
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = () => {
    setIsRegister((v) => !v);
    setError('');
    setPassword('');
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
            {isRegister ? 'Регистрация' : 'Вход в систему'}
          </h2>
          <p className={styles.cardSubtitle}>
            {isRegister
              ? 'Создайте учётную запись администратора'
              : 'Введите логин и пароль для входа'}
          </p>
        </header>

        {error && (
          <div className={styles.error} role="alert">
            <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
              <path
                fill="currentColor"
                d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 4a1 1 0 011 1v4a1 1 0 11-2 0V7a1 1 0 011-1zm0 9a1.1 1.1 0 110-2.2 1.1 1.1 0 010 2.2z"
              />
            </svg>
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
                autoComplete={isRegister ? 'new-password' : 'current-password'}
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
                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
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
              : isRegister
                ? 'Зарегистрироваться'
                : 'Войти'}
          </button>
        </form>

        <p className={styles.footer}>
          {isRegister ? 'Уже есть аккаунт?' : 'Нет аккаунта?'}
          <button type="button" onClick={switchMode} className={styles.linkButton}>
            {isRegister ? 'Войти' : 'Зарегистрироваться'}
          </button>
        </p>
      </div>
    </div>
  );
}
