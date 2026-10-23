import { describe, it, expect } from 'vitest';
import { addMonthsClamped } from '../src/utils/date.js';

describe('addMonthsClamped', () => {
  it('adds months correctly for mid-month dates', () => {
    const d = new Date('2024-06-15');
    const result = addMonthsClamped(d, 3);
    expect(result.toISOString().slice(0, 10)).toBe('2024-09-15');
  });

  it('clamps Jan 31 + 1 month to Feb 29 (leap year)', () => {
    const d = new Date('2024-01-31');
    const result = addMonthsClamped(d, 1);
    expect(result.toISOString().slice(0, 10)).toBe('2024-02-29');
  });

  it('clamps Jan 31 + 1 month to Feb 28 (non-leap year)', () => {
    const d = new Date('2023-01-31');
    const result = addMonthsClamped(d, 1);
    expect(result.toISOString().slice(0, 10)).toBe('2023-02-28');
  });

  it('clamps Mar 31 + 1 month to Apr 30', () => {
    const d = new Date('2024-03-31');
    const result = addMonthsClamped(d, 1);
    expect(result.toISOString().slice(0, 10)).toBe('2024-04-30');
  });

  it('clamps Mar 31 - 1 month to Feb 29 (leap year)', () => {
    const d = new Date('2024-03-31');
    const result = addMonthsClamped(d, -1);
    expect(result.toISOString().slice(0, 10)).toBe('2024-02-29');
  });

  it('clamps Aug 31 + 6 months to Feb 28/29', () => {
    const d = new Date('2024-08-31');
    const result = addMonthsClamped(d, 6);
    expect(result.toISOString().slice(0, 10)).toBe('2025-02-28');
  });

  it('handles 0 months as identity', () => {
    const d = new Date('2024-06-15');
    const result = addMonthsClamped(d, 0);
    expect(result.toISOString().slice(0, 10)).toBe('2024-06-15');
  });
});
