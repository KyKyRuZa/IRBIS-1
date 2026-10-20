import { useState, useEffect, useCallback, useRef } from 'react';

export function useResource(service, params = {}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState(null);
  const paramsKey = JSON.stringify(params);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await service(params);
      // Unwrap paginated responses: { data: [...], pagination: {...} }
      if (result && typeof result === 'object' && !Array.isArray(result) && 'pagination' in result) {
        setData(result.data || []);
        setPagination(result.pagination || null);
      } else {
        setData(Array.isArray(result) ? result : [result]);
        setPagination(null);
      }
    } catch (e) {
      setError(e.message || 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, [service, paramsKey]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
