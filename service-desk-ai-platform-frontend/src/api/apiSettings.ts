import { apiClient } from './client';
import { SettingsResponse, SettingsUpdateResponse } from '../types/settings';
import { ApiResult } from '../types/common';
import { parseApiError } from '../utils/errorHandler';

export async function apiGetSettings(): Promise<ApiResult<SettingsResponse>> {
  try {
    const response = await apiClient.get<SettingsResponse>('/settings');
    return { data: response.data, error: null };
  } catch (error) {
    return { data: null, error: parseApiError(error) };
  }
}

/**
 * Sends only the settings that actually changed. The backend validates the whole batch
 * before writing any of it, so a bad value cannot leave a half-applied configuration.
 */
export async function apiPutSettings(
  updates: Record<string, string>
): Promise<ApiResult<SettingsUpdateResponse>> {
  try {
    const response = await apiClient.put<SettingsUpdateResponse>('/settings', updates);
    return { data: response.data, error: null };
  } catch (error) {
    return { data: null, error: parseApiError(error) };
  }
}

/** Clears an override so the deployed environment value applies again. */
export async function apiResetSetting(key: string): Promise<ApiResult<unknown>> {
  try {
    const response = await apiClient.delete(`/settings/${encodeURIComponent(key)}`);
    return { data: response.data, error: null };
  } catch (error) {
    return { data: null, error: parseApiError(error) };
  }
}
