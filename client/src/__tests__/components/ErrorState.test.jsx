import '@testing-library/jest-dom';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorState from '@components/ui/ErrorState.jsx';

describe('ErrorState', () => {
  it('shows the title and message inside an alert', () => {
    render(<ErrorState title="Ошибка" message="Детали" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Ошибка')).toBeInTheDocument();
    expect(screen.getByText('Детали')).toBeInTheDocument();
  });

  it('calls onRetry when the retry button is clicked', () => {
    const onRetry = vi.fn();
    render(<ErrorState message="x" onRetry={onRetry} />);
    fireEvent.click(screen.getByText('Повторить'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('does not render a retry button without onRetry', () => {
    render(<ErrorState message="x" />);
    expect(screen.queryByText('Повторить')).toBeNull();
  });
});
