import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from '../App.jsx';

vi.mock('axios', () => {
  const mockAxios = {
    get: vi.fn(() => Promise.resolve({ data: [] })),
    post: vi.fn(() => Promise.resolve({})),
    create: vi.fn(() => ({
      get: vi.fn(() => Promise.resolve({ data: [] })),
      post: vi.fn(() => Promise.resolve({})),
      request: vi.fn(() => Promise.resolve({ data: [] })),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() }
      }
    }))
  };
  return { default: mockAxios };
});

describe('App routes', () => {
  it('renders login page when not authenticated', () => {
    localStorage.removeItem('token');
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
    expect(screen.getByText('АЗС ИРБИС — Вход')).toBeDefined();
  });
});
