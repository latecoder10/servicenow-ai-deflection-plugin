import { apiClient } from './client';
import { SyncJobEntity } from '../types/pipeline';
import { ApiResult } from '../types/common';
import { parseApiError } from '../utils/errorHandler';

export async function apiGetPipelineJobs(): Promise<ApiResult<SyncJobEntity[]>> {
  try {
    const response = await apiClient.get<SyncJobEntity[]>('/pipeline/jobs');
    return { data: response.data, error: null };
  } catch (error) {
    return { data: null, error: parseApiError(error) };
  }
}

export async function apiGetPipelineJobById(
  jobId: string
): Promise<ApiResult<SyncJobEntity>> {
  try {
    const response = await apiClient.get<SyncJobEntity>(`/pipeline/jobs/${jobId}`);
    return { data: response.data, error: null };
  } catch (error) {
    return { data: null, error: parseApiError(error) };
  }
}
