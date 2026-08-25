import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useExport } from '@hooks/useExport.js';

describe('useExport', () => {
  let createObjectURL;
  let revokeObjectURL;
  let originalCreateObjectURL;
  let originalRevokeObjectURL;
  let clickSpy;
  let appendSpy;

  beforeEach(() => {
    originalCreateObjectURL = window.URL.createObjectURL;
    originalRevokeObjectURL = window.URL.revokeObjectURL;

    createObjectURL = vi.fn(() => 'blob:url');
    revokeObjectURL = vi.fn();
    window.URL.createObjectURL = createObjectURL;
    window.URL.revokeObjectURL = revokeObjectURL;

    clickSpy = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(clickSpy);
    appendSpy = vi.spyOn(document.body, 'appendChild');
  });

  afterEach(() => {
    window.URL.createObjectURL = originalCreateObjectURL;
    window.URL.revokeObjectURL = originalRevokeObjectURL;
    vi.restoreAllMocks();
  });

  it('downloads the blob and resets the exporting flag', async () => {
    const blob = new Blob(['x']);
    const fetchBlob = vi.fn().mockResolvedValue(blob);
    const { result } = renderHook(() => useExport());
    await act(async () => {
      await result.current.download(fetchBlob, 'file.pdf');
    });
    expect(fetchBlob).toHaveBeenCalled();
    expect(createObjectURL).toHaveBeenCalledWith(blob);
    expect(clickSpy).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:url');
    expect(result.current.exporting).toBe(false);

    const link = appendSpy.mock.calls.map((c) => c[0]).find((n) => n && n.tagName === 'A');
    expect(link).toBeTruthy();
    expect(link.getAttribute('download')).toBe('file.pdf');
    expect(link.href).toContain('blob:url');
  });

  it('records the error on failure', async () => {
    const fetchBlob = vi.fn().mockRejectedValue(new Error('boom'));
    const { result } = renderHook(() => useExport());
    await act(async () => {
      await result.current.download(fetchBlob, 'file.pdf');
    });
    expect(result.current.error).toBe('boom');
    expect(result.current.exporting).toBe(false);
  });

  it('resetError clears the error', async () => {
    const { result } = renderHook(() => useExport());
    act(() => result.current.resetError());
    expect(result.current.error).toBe('');
  });
});
