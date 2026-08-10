import { useState, useEffect, useCallback } from 'react';
import {
  apiGetPipelineJobs,
  apiGetPipelineJobById,
} from '../../../api/apiPipeline';
import { SyncJobEntity, PipelineMetrics } from '../../../types/pipeline';
import { ProblemDetails } from '../../../types/common';
import { useToast } from '../../../hooks/useToast';

export function usePipelineJobs() {
  const [jobs, setJobs] = useState<SyncJobEntity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<ProblemDetails | null>(null);
  const [selectedJob, setSelectedJob] = useState<SyncJobEntity | null>(null);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);

  const { toastError } = useToast();

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await apiGetPipelineJobs();
    if (res.data) {
      setJobs(res.data);
    } else if (res.error) {
      setError(res.error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const viewJobDetail = async (jobId: string) => {
    setDetailLoading(true);
    const res = await apiGetPipelineJobById(jobId);
    setDetailLoading(false);

    if (res.data) {
      setSelectedJob(res.data);
    } else {
      toastError(res.error?.detail || `Job ${jobId} not found`);
    }
  };

  const metrics: PipelineMetrics = {
    totalJobs: jobs.length,
    runningJobs: jobs.filter((j) => j.status === 'RUNNING').length,
    completedJobs: jobs.filter((j) => j.status === 'COMPLETED').length,
    failedJobs: jobs.filter((j) => j.status === 'FAILED').length,
    totalRecordsIngested: jobs.reduce((acc, curr) => acc + (curr.itemsFetched || 0), 0),
    totalRecordsIndexed: jobs.reduce((acc, curr) => acc + (curr.itemsCreated || 0), 0),
  };

  return {
    jobs,
    loading,
    error,
    metrics,
    selectedJob,
    detailLoading,
    fetchJobs,
    viewJobDetail,
    clearSelectedJob: () => setSelectedJob(null),
  };
}
