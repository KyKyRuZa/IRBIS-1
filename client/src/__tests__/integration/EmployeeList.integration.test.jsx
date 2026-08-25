import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

function renderList() {
  localStorage.setItem('user', JSON.stringify({ username: 'admin', role: 'admin' }));
  return render(
    <AuthProvider>
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <EmployeeList />
      </MemoryRouter>
    </AuthProvider>
  );
}

const sampleEmployee = {
  id: 1,
  full_name: 'Иван Иванов',
  personnel_number: '001',
  position: 'Оператор',
  site_name: 'АЗС-1',
  status: 'Работает',
};

describe('EmployeeList (integration)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    employeesService.list.mockResolvedValue([sampleEmployee]);
    sitesService.list.mockResolvedValue([]);
  });

  it('renders employee rows returned by the service', async () => {
    renderList();
    expect(await screen.findByText('Иван Иванов')).toBeInTheDocument();
    expect(screen.getByText('Уволить')).toBeInTheDocument();
  });

  it('renders an error state when the list request fails', async () => {
    employeesService.list.mockRejectedValue(new Error('Ошибка загрузки'));
    renderList();
    expect(await screen.findByText('Ошибка загрузки')).toBeInTheDocument();
  });

  it('terminates an employee through the confirm dialog', async () => {
    employeesService.terminate.mockResolvedValue({});
    employeesService.list
      .mockResolvedValueOnce([sampleEmployee])
      .mockResolvedValueOnce([sampleEmployee]);
    renderList();
    await screen.findByText('Иван Иванов');

    fireEvent.click(screen.getByText('Уволить'));
    fireEvent.click(await screen.findByText('Подтвердить'));

    await waitFor(() => expect(employeesService.terminate).toHaveBeenCalledWith(1));
  });

  it('deletes an employee through the confirm dialog', async () => {
    employeesService.delete.mockResolvedValue({});
    employeesService.list
      .mockResolvedValueOnce([sampleEmployee])
      .mockResolvedValueOnce([sampleEmployee]);
    renderList();
    await screen.findByText('Иван Иванов');

    fireEvent.click(screen.getByText('Удалить'));
    fireEvent.click(await screen.findByText('Подтвердить'));

    await waitFor(() => expect(employeesService.delete).toHaveBeenCalledWith(1));
  });

  it('filters employees by search query', async () => {
    employeesService.list.mockResolvedValue([sampleEmployee]);
    renderList();
    await screen.findByText('Иван Иванов');
    fireEvent.change(screen.getByPlaceholderText(/Поиск по ФИО/i), {
      target: { value: 'Несуществующий' },
    });
    await waitFor(() => expect(screen.queryByText('Иван Иванов')).toBeNull());
    expect(screen.getByText('Сотрудники не найдены')).toBeInTheDocument();
  });
});
