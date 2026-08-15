import { apiClient } from './client';
import { DashboardResponse, DeflectionMetrics, DeflectionTrendResponse } from '../types/analytics';
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

/**
 * Deflection rate over time.
 *
 * Hourly exists because a freshly seeded instance has a single day of telemetry, where
 * a daily series is one point and reads as a broken chart rather than as young data.
 */
export async function apiGetDeflectionTrend(
  windowDays = 30,
  granularity: 'DAY' | 'HOUR' = 'DAY'
): Promise<ApiResult<DeflectionTrendResponse>> {
  try {
    const response = await apiClient.get<DeflectionTrendResponse>('/analytics/deflection-trend', {
      params: { windowDays, granularity },
    });
    return { data: response.data, error: null };
  } catch (error) {
    return { data: null, error: parseApiError(error) };
  }
}
