import { useState, useEffect, useCallback } from 'react';
import {
  apiGetConnectors,
  apiPostConnectorTest,
  apiPostConnectorSync,
  apiGetConnectorHistory,
} from '../../../api/apiConnectors';
import { ConnectorTestResult, SyncRequest, SyncResult } from '../../../types/connector';
import { SyncJobEntity } from '../../../types/pipeline';
import { ProblemDetails } from '../../../types/common';
import { useToast } from '../../../hooks/useToast';

export function useConnectors() {
  const [connectors, setConnectors] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<ProblemDetails | null>(null);
  const [testResults, setTestResults] = useState<Record<string, ConnectorTestResult>>({});
  const [selectedConnectorHistory, setSelectedConnectorHistory] = useState<SyncJobEntity[]>([]);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);
  const [syncLoading, setSyncLoading] = useState<boolean>(false);

  const { toastSuccess, toastError, toastInfo } = useToast();

  const fetchConnectors = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await apiGetConnectors();
    if (res.data) {
      setConnectors(res.data);
    } else if (res.error) {
      setError(res.error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchConnectors();
  }, [fetchConnectors]);

  const testConnector = async (connectorType: string, config?: Record<string, string>) => {
    toastInfo(`Testing connection to ${connectorType}...`);
    const res = await apiPostConnectorTest(connectorType, config);
    if (res.error) {
      toastError(res.error.detail || `Connection to ${connectorType} failed.`);
      setTestResults((prev) => ({
        ...prev,
        [connectorType]: { connectorType, status: 'DISCONNECTED', message: res.error.detail },
      }));
    } else {
      toastSuccess(`Connection to ${connectorType} verified successfully!`);
      setTestResults((prev) => ({
        ...prev,
        [connectorType]: res.data,
      }));
    }
  };

  const triggerSync = async (connectorType: string, request: SyncRequest): Promise<SyncResult | null> => {
    setSyncLoading(true);
    toastInfo(`Initiating ${request.syncType} sync for ${connectorType}...`);
    const res = await apiPostConnectorSync(connectorType, request);
    setSyncLoading(false);

    if (res.error) {
      toastError(res.error.detail || `Failed to trigger sync for ${connectorType}`);
      return null;
    } else {
      toastSuccess(`Sync job ${res.data.jobId} created for ${connectorType}!`);
      fetchConnectorHistory(connectorType);
      return res.data;
    }
  };

  const fetchConnectorHistory = async (connectorType: string) => {
    setHistoryLoading(true);
    const res = await apiGetConnectorHistory(connectorType);
    setHistoryLoading(false);

    if (res.data) {
      setSelectedConnectorHistory(res.data);
    }
  };

  return {
    connectors,
    loading,
    error,
    testResults,
    selectedConnectorHistory,
    historyLoading,
    syncLoading,
    testConnector,
    triggerSync,
    fetchConnectorHistory,
    refreshConnectors: fetchConnectors,
  };
}
