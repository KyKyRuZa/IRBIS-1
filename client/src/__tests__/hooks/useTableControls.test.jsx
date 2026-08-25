import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTableControls, filterAndSort } from '@hooks/useTableControls.js';

const items = [
  { name: 'Иван', age: 30, site: 'A' },
  { name: 'Пётр', age: 25, site: 'B' },
  { name: 'Анна', age: 40, site: 'A' },
];

describe('filterAndSort', () => {
  it('filters by search across the given fields', () => {
    const r = filterAndSort(items, { search: 'иван', searchFields: ['name'] });
    expect(r).toHaveLength(1);
    expect(r[0].name).toBe('Иван');
  });

  it('filters by exact filter value', () => {
    const r = filterAndSort(items, { filters: { site: 'A' } });
    expect(r).toHaveLength(2);
  });

  it('sorts ascending', () => {
    const r = filterAndSort(items, { sort: { key: 'age', dir: 'asc' } });
    expect(r.map((x) => x.age)).toEqual([25, 30, 40]);
  });

  it('sorts descending', () => {
    const r = filterAndSort(items, { sort: { key: 'age', dir: 'desc' } });
    expect(r.map((x) => x.age)).toEqual([40, 30, 25]);
  });

  it('returns empty array for non-array input', () => {
    expect(filterAndSort(null, {})).toEqual([]);
  });

  it('combines search, filter and sort', () => {
    const r = filterAndSort(items, {
      search: 'a',
      searchFields: ['site'],
      filters: { site: 'A' },
      sort: { key: 'name', dir: 'asc' },
    });
    expect(r.map((x) => x.name)).toEqual(['Анна', 'Иван']);
  });
});

describe('useTableControls', () => {
  it('toggleSort cycles asc -> desc -> null', () => {
    const { result } = renderHook(() => useTableControls());
    act(() => result.current.toggleSort('name'));
    expect(result.current.sort).toEqual({ key: 'name', dir: 'asc' });
    act(() => result.current.toggleSort('name'));
    expect(result.current.sort).toEqual({ key: 'name', dir: 'desc' });
    act(() => result.current.toggleSort('name'));
    expect(result.current.sort).toBeNull();
  });

  it('setSearch applies immediately when debounce is disabled', () => {
    const { result } = renderHook(() => useTableControls({ debounceSearch: false }));
    act(() => result.current.setSearch('abc'));
    expect(result.current.searchApplied).toBe('abc');
  });

  it('setSearch debounces the applied value', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useTableControls());
    act(() => result.current.setSearch('xyz'));
    expect(result.current.searchApplied).toBe('');
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current.searchApplied).toBe('xyz');
    vi.useRealTimers();
  });

  it('resetFilters restores the initial state', () => {
    const { result } = renderHook(() =>
      useTableControls({ filters: { status: '' }, sort: { key: 'name', dir: 'asc' } })
    );
    act(() => result.current.setFilter('status', 'x'));
    act(() => result.current.resetFilters());
    expect(result.current.filters).toEqual({ status: '' });
  });
});
