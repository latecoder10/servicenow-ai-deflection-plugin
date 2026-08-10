import { useState, useEffect, useCallback } from 'react';
import { apiGetHealth } from '../../../api/apiHealth';
import { apiGetServiceNowHealth } from '../../../api/apiServiceNow';
import { HealthResponse } from '../../../types/health';
import { ServiceNowHealthResponse } from '../../../api/apiServiceNow';
import { ProblemDetails } from '../../../types/common';

export function useHealth() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [serviceNowHealth, setServiceNowHealth] = useState<ServiceNowHealthResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<ProblemDetails | null>(null);

  const fetchHealthData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [healthRes, snRes] = await Promise.all([
      apiGetHealth(),
      apiGetServiceNowHealth(),
    ]);

    if (healthRes.data) setHealth(healthRes.data);
    if (snRes.data) setServiceNowHealth(snRes.data);

    if (healthRes.error) setError(healthRes.error);

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchHealthData();
  }, [fetchHealthData]);

  return {
    health,
    serviceNowHealth,
    loading,
    error,
    refreshHealth: fetchHealthData,
  };
}
