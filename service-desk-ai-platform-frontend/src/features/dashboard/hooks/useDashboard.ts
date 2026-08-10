import { useState, useEffect, useCallback } from 'react';
import { apiGetAnalyticsDashboard, apiGetAnalyticsDeflection } from '../../../api/apiAnalytics';
import { apiGetPipelineJobs } from '../../../api/apiPipeline';
import { apiPostKnowledgeLoadSynthetic } from '../../../api/apiKnowledge';
import { apiPostServiceNowSyncIncremental } from '../../../api/apiServiceNow';
import { DashboardResponse, DeflectionMetrics } from '../../../types/analytics';
import { SyncJobEntity } from '../../../types/pipeline';
import { ProblemDetails } from '../../../types/common';
import { useToast } from '../../../hooks/useToast';

export function useDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(null);
  const [deflectionMetrics, setDeflectionMetrics] = useState<DeflectionMetrics | null>(null);
  const [recentJobs, setRecentJobs] = useState<SyncJobEntity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<ProblemDetails | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const { toastSuccess, toastError, toastInfo } = useToast();

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [dashRes, defRes, jobsRes] = await Promise.all([
      apiGetAnalyticsDashboard(),
      apiGetAnalyticsDeflection(),
      apiGetPipelineJobs(),
    ]);

    if (dashRes.error) {
      setError(dashRes.error);
    } else {
      setDashboardData(dashRes.data);
    }

    if (defRes.data) {
      setDeflectionMetrics(defRes.data);
    }

    if (jobsRes.data) {
      setRecentJobs(jobsRes.data.slice(0, 5));
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleTriggerSync = async () => {
    setActionLoading(true);
    toastInfo('Triggering incremental sync...');
    const res = await apiPostServiceNowSyncIncremental({ workspace: 'Enterprise IT' });
    setActionLoading(false);

    if (res.error) {
      toastError(res.error.detail || 'Failed to trigger sync');
    } else {
      toastSuccess(`Sync triggered! Job ID: ${res.data.jobId}`);
      fetchDashboard();
    }
  };

  const handleLoadSyntheticData = async () => {
    setActionLoading(true);
    toastInfo('Generating synthetic knowledge data...');
    const res = await apiPostKnowledgeLoadSynthetic();
    setActionLoading(false);

    if (res.error) {
      toastError(res.error.detail || 'Failed to load synthetic data');
    } else {
      toastSuccess(`Loaded ${res.data.created} records (${res.data.resolved} resolved).`);
      fetchDashboard();
    }
  };

  return {
    dashboardData,
    deflectionMetrics,
    recentJobs,
    loading,
    error,
    actionLoading,
    refresh: fetchDashboard,
    handleTriggerSync,
    handleLoadSyntheticData,
  };
}
