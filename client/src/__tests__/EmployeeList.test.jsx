import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import EmployeeList from '../pages/EmployeeList.jsx';

function renderWithRouter(ui, { route = '/' } = {}) {
  window.history.pushState({}, 'Test page', route);
  return render(<BrowserRouter>{ui}</BrowserRouter>);
}

vi.mock('axios', () => {
  const mockAxios = {
    get: vi.fn(() => Promise.resolve({ data: [
      { id: 1, full_name: 'Иван Иванов', personnel_number: '001', position: 'Старший оператор', site_name: 'АЗС-1', clothing_size: '48', shoe_size: '42', hat_size: '58', respirator_size: 'M', gloves_size: 'L', status: 'active' },
    ]})),
    post: vi.fn(() => Promise.resolve({})),
    patch: vi.fn(() => Promise.resolve({})),
  };
  return { default: mockAxios };
});

describe('EmployeeList', () => {
  it('renders terminate button only for admin user', async () => {
    renderWithRouter(<EmployeeList user={{ role: 'admin' }} />);
    expect(await screen.findByText('Уволить')).toBeDefined();
  });

  it('does not render terminate button for non-admin user', async () => {
    renderWithRouter(<EmployeeList user={{ role: 'user' }} />);
    expect(screen.queryByText('Уволить')).toBeNull();
  });
});
