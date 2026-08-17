import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/');
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isRegister) {
        await axios.post('/api/auth/register', { username, password, role: 'admin' });
        const res = await axios.post('/api/auth/login', { username, password });
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify({ username: res.data.username, role: res.data.role }));
        navigate('/');
      } else {
        const res = await axios.post('/api/auth/login', { username, password });
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify({ username: res.data.username, role: res.data.role }));
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка');
    }
  };

  return (
    <div className="page-wrapper page-login">
      <div className="page-header">
        <div className="container">
          <div>
            <h1>АЗС ИРБИС</h1>
            <div className="page-subtitle">Система учёта СИЗ и спецодежды</div>
          </div>
        </div>
      </div>
      <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '30px' }}>
          <h2 style={{ textAlign: 'center', color: 'var(--primary)', marginBottom: '20px' }}>
            {isRegister ? 'Регистрация' : 'АЗС ИРБИС — Вход'}
          </h2>
          {error && <div style={{ color: 'red', marginBottom: '15px', textAlign: 'center' }}>{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Логин</label>
              <input 
                type="text" 
                className="form-control"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Пароль</label>
              <input 
                type="password" 
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn" style={{ width: '100%' }}>
              {isRegister ? 'Зарегистрироваться' : 'Войти'}
            </button>
          </form>
          <p style={{ textAlign: 'center', marginTop: '15px', fontSize: '14px' }}>
            {isRegister ? 'Уже есть аккаунт?' : 'Нет аккаунта?'}{' '}
            <button 
              onClick={() => { setIsRegister(!isRegister); setError(''); }}
              style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline' }}
            >
              {isRegister ? 'Войти' : 'Зарегистрироваться'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
