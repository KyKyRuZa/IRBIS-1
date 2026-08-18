import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '@lib/services/auth.service.js';
import { useAuth } from '@hooks/useAuth.js';
import styles from './Login.module.css';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isRegister) {
        await authService.register(username, password, 'admin');
        const res = await authService.login(username, password);
        login(res.token, { username: res.username, role: res.role });
        navigate('/');
      } else {
        const res = await authService.login(username, password);
        login(res.token, { username: res.username, role: res.role });
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка');
    }
  };

   return (
    <div className={styles.pageWrapper}>
      <div className={styles.pageHeader}>
        <div className="container">
          <div>
            <h1>АЗС ИРБИС</h1>
            <div className={styles.subtitle}>Система учёта СИЗ и спецодежды</div>
          </div>
        </div>
      </div>
      <div className={styles.content}>
        <div className={styles.card}>
          <h2 className={styles.heading}>
            {isRegister ? 'Регистрация' : 'АЗС ИРБИС — Вход'}
          </h2>
          {error && <div className={styles.error}>{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className={`form-group ${styles.field}`}>
              <label>Логин</label>
              <input
                type="text"
                className="form-control"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className={`form-group ${styles.field}`}>
              <label>Пароль</label>
              <input
                type="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className={`btn ${styles.submitButton}`}>
              {isRegister ? 'Зарегистрироваться' : 'Войти'}
            </button>
          </form>
          <p className={styles.footer}>
            {isRegister ? 'Уже есть аккаунт?' : 'Нет аккаунта?'}
            <button
              type="button"
              onClick={() => { setIsRegister(!isRegister); setError(''); }}
              className={styles.linkButton}
            >
              {isRegister ? 'Войти' : 'Зарегистрироваться'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
