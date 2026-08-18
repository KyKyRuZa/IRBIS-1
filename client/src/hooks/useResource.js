import { useState, useEffect, useCallback, useRef } from 'react';

export function useResource(service, params = {}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const paramsRef = useRef(params);

  useEffect(() => {
    paramsRef.current = params;
  });

  const fetch = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await service(paramsRef.current);
      setData(Array.isArray(result) ? result : [result]);
    } catch (e) {
      setError(e.message || 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, [service]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
