import '@testing-library/jest-dom';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Pagination from '@components/ui/Pagination.jsx';

describe('Pagination', () => {
  it('renders page buttons for multi-page data', () => {
    render(<Pagination totalItems={50} itemsPerPage={10} currentPage={1} onPageChange={vi.fn()} />);
    expect(screen.getByLabelText('Вперёд')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('calls onPageChange with the next page', () => {
    const onPageChange = vi.fn();
    render(<Pagination totalItems={50} itemsPerPage={10} currentPage={1} onPageChange={onPageChange} />);
    fireEvent.click(screen.getByLabelText('Вперёд'));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('calls onPageChange when a page number is clicked', () => {
    const onPageChange = vi.fn();
    render(<Pagination totalItems={50} itemsPerPage={10} currentPage={1} onPageChange={onPageChange} />);
    fireEvent.click(screen.getByText('3'));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it('disables the back button on the first page', () => {
    render(<Pagination totalItems={50} itemsPerPage={10} currentPage={1} onPageChange={vi.fn()} />);
    expect(screen.getByLabelText('Назад')).toBeDisabled();
  });

  it('renders nothing when there is a single page', () => {
    const { container } = render(<Pagination totalItems={5} itemsPerPage={10} currentPage={1} onPageChange={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });
});
