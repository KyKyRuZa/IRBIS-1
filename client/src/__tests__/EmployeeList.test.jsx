import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '@contexts/AuthContext.jsx';
import EmployeeList from '@features/employees/EmployeeList.jsx';
import { employeesService } from '@/lib/services/employees.service.js';
import { sitesService } from '@/lib/services/sites.service.js';

vi.mock('@/lib/services/employees.service.js', () => {
  const employeesService = {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    terminate: vi.fn(),
    delete: vi.fn(),
    search: vi.fn(),
    bySite: vi.fn(),
  };
  return { employeesService };
});

vi.mock('@/lib/services/sites.service.js', () => {
  const sitesService = { list: vi.fn() };
  return { sitesService };
});

function renderWithRouter(ui, role = 'admin') {
  localStorage.setItem('user', JSON.stringify({ username: 'u', role }));
  localStorage.setItem('token', 't');
  window.history.pushState({}, 'Test', '/');
  return render(
    <AuthProvider>
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        {ui}
      </MemoryRouter>
    </AuthProvider>
  );
}

const activeEmployee = {
  id: 1,
  full_name: 'Иван Иванов',
  personnel_number: '001',
  position: 'Старший оператор',
  site_name: 'АЗС-1',
  clothing_size: '48',
  shoe_size: '42',
  hat_size: '58',
  respirator_size: 'M',
  gloves_size: 'L',
  status: 'Работает',
};

const terminatedEmployee = { ...activeEmployee, id: 2, status: 'Уволен' };

describe('EmployeeList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sitesService.list.mockResolvedValue([]);
  });

  it('renders terminate button for an active employee', async () => {
    employeesService.list.mockResolvedValue([activeEmployee]);
    renderWithRouter(<EmployeeList />);
    expect(await screen.findByText('Уволить')).toBeInTheDocument();
  });

  it('does not render terminate button for a terminated employee', async () => {
    employeesService.list.mockResolvedValue([terminatedEmployee]);
    renderWithRouter(<EmployeeList />);
    expect(await screen.findByText('Иван Иванов')).toBeInTheDocument();
    expect(screen.queryByText('Уволить')).toBeNull();
  });
});
