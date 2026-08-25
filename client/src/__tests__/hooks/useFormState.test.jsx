import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFormState } from '@hooks/useFormState.js';

describe('useFormState', () => {
  it('initializes with the provided state', () => {
    const { result } = renderHook(() => useFormState({ a: 1 }));
    expect(result.current.values).toEqual({ a: 1 });
  });

  it('setValue updates a single field', () => {
    const { result } = renderHook(() => useFormState({ a: 1, b: 2 }));
    act(() => result.current.setValue('a', 9));
    expect(result.current.values).toEqual({ a: 9, b: 2 });
  });

  it('setMany merges multiple fields', () => {
    const { result } = renderHook(() => useFormState({ a: 1 }));
    act(() => result.current.setMany({ a: 2, c: 3 }));
    expect(result.current.values).toEqual({ a: 2, c: 3 });
  });

  it('reset restores the initial state', () => {
    const { result } = renderHook(() => useFormState({ a: 1 }));
    act(() => result.current.setValue('a', 5));
    act(() => result.current.reset());
    expect(result.current.values).toEqual({ a: 1 });
  });

  it('bind returns value and an onChange handler', () => {
    const { result } = renderHook(() => useFormState({ name: 'x' }));
    const bound = result.current.bind('name');
    expect(bound.value).toBe('x');
    act(() => bound.onChange({ target: { value: 'y' } }));
    expect(result.current.values.name).toBe('y');
  });
});
