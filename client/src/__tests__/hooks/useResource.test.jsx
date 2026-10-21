import { describe, it, expect, vi } from 'vitest'
import { waitFor, act, renderHook } from '@testing-library/react'
import { useResource } from '@hooks/useResource.js'
import { renderHookWithClient, createTestQueryClient } from '@/__tests__/lib/test-utils.jsx'
import { QueryClientProvider } from '@tanstack/react-query'

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

  it('uses custom queryKey when provided', async () => {
    const service = vi.fn().mockResolvedValue([{ id: 1 }])
    const { result } = renderHookWithClient(() =>
      useResource(service, {}, { queryKey: ['custom-key'] })
    )
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data).toEqual([{ id: 1 }])
  })

  it('does not collide when two services share default params', async () => {
    const normsService = vi.fn().mockResolvedValue([{ type: 'norm' }])
    const issuesService = vi.fn().mockResolvedValue([{ type: 'issue' }])

    const wrapper = ({ children }) => {
      const client = createTestQueryClient()
      return <QueryClientProvider client={client}>{children}</QueryClientProvider>
    }

    const { result: normsResult } = renderHook(
      () => useResource(normsService, {}, { queryKey: ['norms'] }),
      { wrapper }
    )
    const { result: issuesResult } = renderHook(
      () => useResource(issuesService, {}, { queryKey: ['issues'] }),
      { wrapper }
    )

    await waitFor(() => expect(normsResult.current.loading).toBe(false))
    await waitFor(() => expect(issuesResult.current.loading).toBe(false))

    expect(normsResult.current.data).toEqual([{ type: 'norm' }])
    expect(issuesResult.current.data).toEqual([{ type: 'issue' }])
  })
})
