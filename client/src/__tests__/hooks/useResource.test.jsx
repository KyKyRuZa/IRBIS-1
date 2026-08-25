import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useResource } from '@hooks/useResource.js';

describe('useResource', () => {
  it('loads data and clears the loading flag', async () => {
    const service = vi.fn().mockResolvedValue([{ id: 1 }]);
    const { result } = renderHook(() => useResource(service));
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual([{ id: 1 }]);
    expect(result.current.error).toBe('');
  });

  it('wraps non-array results in an array', async () => {
    const service = vi.fn().mockResolvedValue({ id: 1 });
    const { result } = renderHook(() => useResource(service));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual([{ id: 1 }]);
  });

  it('stores the error message on failure', async () => {
    const service = vi.fn().mockRejectedValue(new Error('fail'));
    const { result } = renderHook(() => useResource(service));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('fail');
  });

  it('refetch reloads data', async () => {
    const service = vi
      .fn()
      .mockResolvedValueOnce([{ id: 1 }])
      .mockResolvedValueOnce([{ id: 2 }]);
    const { result } = renderHook(() => useResource(service));
    await waitFor(() => expect(result.current.data).toEqual([{ id: 1 }]));
    await act(async () => {
      await result.current.refetch();
    });
    expect(result.current.data).toEqual([{ id: 2 }]);
  });
});
