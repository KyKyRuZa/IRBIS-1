import '@testing-library/jest-dom';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import StatusBadge from '@components/ui/StatusBadge.jsx';

describe('StatusBadge', () => {
  it('renders the russian label for a known status', () => {
    render(<StatusBadge status="active" />);
    expect(screen.getByText('Активен')).toBeInTheDocument();
  });

  it('falls back to the raw status value for unknown statuses', () => {
    render(<StatusBadge status="weird" />);
    expect(screen.getByText('weird')).toBeInTheDocument();
  });

  it('renders nothing when status is empty', () => {
    const { container } = render(<StatusBadge status="" />);
    expect(container).toBeEmptyDOMElement();
  });
});
