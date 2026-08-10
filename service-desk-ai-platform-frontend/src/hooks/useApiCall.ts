import { useState, useCallback } from 'react';
import { ApiResult, ProblemDetails } from '../types/common';

export function useApiCall<T, Args extends unknown[] = []>(
  apiFn: (...args: Args) => Promise<ApiResult<T>>
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<ProblemDetails | null>(null);

  const execute = useCallback(
    async (...args: Args): Promise<ApiResult<T>> => {
      setLoading(true);
      setError(null);
      const result = await apiFn(...args);
      if (result.error) {
        setError(result.error);
        setData(null);
      } else {
        setData(result.data);
        setError(null);
      }
      setLoading(false);
      return result;
    },
    [apiFn]
  );

  return {
    data,
    loading,
    error,
    execute,
    setData,
    setError,
  };
}
