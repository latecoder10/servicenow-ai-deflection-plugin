import { apiClient } from './client';
import { SyncJobEntity } from '../types/pipeline';
import { ApiResult } from '../types/common';
import { parseApiError } from '../utils/errorHandler';

/**
 * Sync job history.
 *
 * These used to call /pipeline/jobs, which no longer exists - PipelineController was
 * removed and the page had been failing silently ever since. The same rows are served
 * per connector by /connectors/{type}/history, so the jobs are gathered from the
 * connectors and merged newest-first here.
 */
const CONNECTOR_TYPES = ['SERVICENOW', 'GOOGLE_DRIVE'] as const;

function startedAtMillis(job: SyncJobEntity): number {
  const value = job.startedAt ? Date.parse(job.startedAt) : NaN;
  return Number.isNaN(value) ? 0 : value;
}

export async function apiGetPipelineJobs(): Promise<ApiResult<SyncJobEntity[]>> {
  try {
    const responses = await Promise.all(
      CONNECTOR_TYPES.map((type) =>
        apiClient
          .get<SyncJobEntity[]>(`/connectors/${type}/history`)
          // One connector with no history, or a type this build does not register,
          // must not blank the whole page.
          .then((r) => r.data ?? [])
          .catch(() => [] as SyncJobEntity[])
      )
    );

    const merged = responses
      .flat()
      .sort((a, b) => startedAtMillis(b) - startedAtMillis(a));

    return { data: merged, error: null };
  } catch (error) {
    return { data: null, error: parseApiError(error) };
  }
}

/**
 * A single job. There is no by-id endpoint, so it is resolved from the merged history
 * rather than fetched - the list is small and already cached by the page.
 */
export async function apiGetPipelineJobById(
  jobId: string
): Promise<ApiResult<SyncJobEntity>> {
  const { data, error } = await apiGetPipelineJobs();
  if (error) {
    return { data: null, error };
  }
  const match = data?.find((job) => job.jobId === jobId) ?? null;
  if (!match) {
    return {
      data: null,
      error: {
        type: 'https://servicedesk.ai/errors/not-found',
        title: 'Sync job not found',
        status: 404,
        detail: `No sync job found with id ${jobId}`,
        instance: '/api/v1/connectors',
        correlationId: `pipeline-${Date.now()}`,
        timestamp: new Date().toISOString(),
      },
    };
  }
  return { data: match, error: null };
}
