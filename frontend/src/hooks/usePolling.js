import { useState, useEffect, useCallback, useRef } from 'react';

export default function usePolling(fetchFn, intervalMs = 30000) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);
  const fetchFnRef = useRef(fetchFn);
  const mountedRef = useRef(true);

  // Keep fetchFn ref up to date without re-triggering effect
  useEffect(() => {
    fetchFnRef.current = fetchFn;
  }, [fetchFn]);

  const execute = useCallback(async () => {
    try {
      setError(null);
      const result = await fetchFnRef.current();
      if (mountedRef.current) {
        setData(result);
        setLoading(false);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err);
        setLoading(false);
      }
    }
  }, []);

  const refresh = useCallback(() => {
    setLoading(true);
    return execute();
  }, [execute]);

  useEffect(() => {
    mountedRef.current = true;

    // Initial fetch
    execute();

    // Set up polling interval
    intervalRef.current = setInterval(execute, intervalMs);

    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [execute, intervalMs]);

  return { data, loading, error, refresh };
}
