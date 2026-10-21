import { describe, it, expect, vi } from 'vitest'
import { waitFor, act } from '@testing-library/react'
import { useResource } from '@hooks/useResource.js'
import { renderHookWithClient } from '@/__tests__/lib/test-utils.jsx'

describe('useResource', () => {
  it('loads data and clears the loading flag', async () => {
    const service = vi.fn().mockResolvedValue([{ id: 1 }])
    const { result } = renderHookWithClient(() => useResource(service))
    expect(result.current.loading).toBe(true)
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data).toEqual([{ id: 1 }])
    expect(result.current.error).toBe('')
  })

  it('wraps non-array results in an array', async () => {
    const service = vi.fn().mockResolvedValue({ id: 1 })
    const { result } = renderHookWithClient(() => useResource(service))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data).toEqual([{ id: 1 }])
  })

  it('unwraps paginated responses', async () => {
    const service = vi.fn().mockResolvedValue({
      data: [{ id: 1 }, { id: 2 }],
      pagination: { page: 1, total: 2 },
    })
    const { result } = renderHookWithClient(() => useResource(service))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data).toEqual([{ id: 1 }, { id: 2 }])
    expect(result.current.pagination).toEqual({ page: 1, total: 2 })
  })

  it('stores the error message on failure', async () => {
    const service = vi.fn().mockRejectedValue(new Error('fail'))
    const { result } = renderHookWithClient(() => useResource(service, {}, { retry: false }))
    await waitFor(
      () => expect(result.current.error).toBe('fail'),
      { timeout: 3000 }
    )
    expect(result.current.loading).toBe(false)
  })

  it('refetch reloads data', async () => {
    const service = vi
      .fn()
      .mockResolvedValueOnce([{ id: 1 }])
      .mockResolvedValueOnce([{ id: 2 }])
    const { result } = renderHookWithClient(() => useResource(service))
    await waitFor(() => expect(result.current.data).toEqual([{ id: 1 }]))
    await act(async () => {
      await result.current.refetch()
    })
    await waitFor(() => expect(result.current.data).toEqual([{ id: 2 }]))
  })

  it('handles params function (dynamic fetch)', async () => {
    const service = vi.fn().mockResolvedValue([{ id: 1 }])
    const { result } = renderHookWithClient(() => useResource(() => service()))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data).toEqual([{ id: 1 }])
  })
})
