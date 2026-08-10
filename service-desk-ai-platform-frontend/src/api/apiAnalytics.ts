import { apiClient } from './client';
import { DashboardResponse, DeflectionMetrics } from '../types/analytics';
import { ApiResult } from '../types/common';
import { parseApiError } from '../utils/errorHandler';

export async function apiGetAnalyticsDeflection(): Promise<ApiResult<DeflectionMetrics>> {
  try {
    const response = await apiClient.get<DeflectionMetrics>('/analytics/deflection');
    return { data: response.data, error: null };
  } catch (error) {
    return { data: null, error: parseApiError(error) };
  }
}

export async function apiGetAnalyticsDashboard(): Promise<ApiResult<DashboardResponse>> {
  try {
    const response = await apiClient.get<DashboardResponse>('/analytics/dashboard');
    return { data: response.data, error: null };
  } catch (error) {
    return { data: null, error: parseApiError(error) };
  }
}
