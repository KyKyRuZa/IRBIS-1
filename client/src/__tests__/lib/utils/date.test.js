import { describe, it, expect } from 'vitest';
import { formatDate } from '@/lib/utils/date.js';

describe('formatDate', () => {
  it('returns empty string for null/undefined', () => {
    expect(formatDate(null)).toBe('');
    expect(formatDate(undefined)).toBe('');
    expect(formatDate('')).toBe('');
  });

  it('formats a date string as DD.MM.YYYY', () => {
    expect(formatDate('2024-01-05')).toBe('05.01.2024');
  });

  it('formats a Date object', () => {
    expect(formatDate(new Date(2023, 11, 31))).toBe('31.12.2023');
  });

  it('formats a numeric timestamp', () => {
    expect(formatDate(new Date(2022, 0, 2).getTime())).toBe('02.01.2022');
  });

  it('returns the original value for an invalid date', () => {
    expect(formatDate('not-a-date')).toBe('not-a-date');
  });

  it('pads single-digit day and month with leading zeros', () => {
    expect(formatDate('2024-3-4')).toBe('04.03.2024');
  });
});
