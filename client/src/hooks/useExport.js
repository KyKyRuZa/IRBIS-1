import { useState, useCallback } from 'react';

export function useExport() {
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');

  const download = useCallback(async (fetchBlob, filename) => {
    setExporting(true);
    setError('');
    try {
      const blob = await fetchBlob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      setError(e.message || 'Ошибка экспорта');
      console.error(e);
    } finally {
      setExporting(false);
    }
  }, []);

  const resetError = useCallback(() => setError(''), []);

  return { download, exporting, error, resetError };
}
