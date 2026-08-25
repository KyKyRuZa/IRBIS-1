import { useState, useMemo, useCallback, useRef } from 'react';

export function useTableControls({
  filters: initialFilters = {},
  sort: initialSort = null,
  debounceSearch = true
} = {}) {
  const [search, setSearchRaw] = useState('');
  const [searchApplied, setSearchApplied] = useState('');
  const [filters, setFilters] = useState(initialFilters);
  const [sort, setSort] = useState(initialSort);
  const timerRef = useRef(null);

  const setSearch = useCallback((value) => {
    setSearchRaw(value);
    if (!debounceSearch) {
      setSearchApplied(value);
      return;
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setSearchApplied(value), 300);
  }, [debounceSearch]);

  const setFilter = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setSearchRaw('');
    setSearchApplied('');
    setFilters(initialFilters);
    setSort(initialSort);
  }, [initialFilters, initialSort]);

  const toggleSort = useCallback((key) => {
    setSort((prev) => {
      if (!prev || prev.key !== key) return { key, dir: 'asc' };
      if (prev.dir === 'asc') return { key, dir: 'desc' };
      return null;
    });
  }, []);

  return {
    search,
    searchApplied,
    setSearch,
    filters,
    setFilters,
    setFilter,
    sort,
    toggleSort,
    resetFilters
  };
}

function compareValues(a, b) {
  if (a === null || a === undefined || a === '') return 1;
  if (b === null || b === undefined || b === '') return -1;

  const aNum = typeof a === 'number' ? a : Number(a);
  const bNum = typeof b === 'number' ? b : Number(b);
  if (!Number.isNaN(aNum) && !Number.isNaN(bNum) && a !== b && a !== '' && b !== '') {
    return aNum - bNum;
  }

  const aDate = Date.parse(a);
  const bDate = Date.parse(b);
  if (!Number.isNaN(aDate) && !Number.isNaN(bDate) && a !== b) {
    return aDate - bDate;
  }

  return String(a).localeCompare(String(b), 'ru');
}

export function filterAndSort(items, { search = '', filters = {}, sort = null, searchFields = [] }) {
  if (!Array.isArray(items)) return [];

  const query = search.trim().toLowerCase();
  let result = items;

  if (query && searchFields.length) {
    result = result.filter((item) =>
      searchFields.some((field) => {
        const value = item[field];
        return value != null && String(value).toLowerCase().includes(query);
      })
    );
  }

  for (const [key, value] of Object.entries(filters)) {
    if (value === '' || value === null || value === undefined) continue;
    result = result.filter((item) => {
      const itemValue = item[key];
      if (itemValue === null || itemValue === undefined) return false;
      return String(itemValue) === String(value);
    });
  }

  if (sort && sort.key) {
    const { key, dir } = sort;
    result = [...result].sort((a, b) => {
      const cmp = compareValues(a[key], b[key]);
      return dir === 'desc' ? -cmp : cmp;
    });
  }

  return result;
}

export function useFilteredList(items, { search, filters, sort, searchFields }) {
  return useMemo(
    () => filterAndSort(items, { search, filters, sort, searchFields }),
    [items, search, filters, sort, searchFields]
  );
}
