import { apiClient } from './client';
import { HealthResponse } from '../types/health';
import { ApiResult } from '../types/common';
import { parseApiError } from '../utils/errorHandler';

export async function apiGetHealth(): Promise<ApiResult<HealthResponse>> {
  try {
    const response = await apiClient.get<HealthResponse>('/health');
    return { data: response.data, error: null };
  } catch (error) {
    return { data: null, error: parseApiError(error) };
  }
}
