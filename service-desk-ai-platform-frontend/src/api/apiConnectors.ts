import { apiClient } from './client';
import { ConnectorTestResult, SyncRequest, SyncResult } from '../types/connector';
import { SyncJobEntity } from '../types/pipeline';
import { ApiResult } from '../types/common';
import { parseApiError } from '../utils/errorHandler';

export async function apiGetConnectors(): Promise<ApiResult<string[]>> {
  try {
    const response = await apiClient.get<string[]>('/connectors');
    return { data: response.data, error: null };
  } catch (error) {
    return { data: null, error: parseApiError(error) };
  }
}

export async function apiPostConnectorTest(
  connectorType: string,
  config?: Record<string, string>
): Promise<ApiResult<ConnectorTestResult>> {
  try {
    const response = await apiClient.post<ConnectorTestResult>(
      `/connectors/${connectorType}/test`,
      config || {}
    );
    return { data: response.data, error: null };
  } catch (error) {
    return { data: null, error: parseApiError(error) };
  }
}

export async function apiPostConnectorSync(
  connectorType: string,
  data: SyncRequest
): Promise<ApiResult<SyncResult>> {
  try {
    const response = await apiClient.post<SyncResult>(
      `/connectors/${connectorType}/sync`,
      data
    );
    return { data: response.data, error: null };
  } catch (error) {
    return { data: null, error: parseApiError(error) };
  }
}

export async function apiGetConnectorHistory(
  connectorType: string
): Promise<ApiResult<SyncJobEntity[]>> {
  try {
    const response = await apiClient.get<SyncJobEntity[]>(
      `/connectors/${connectorType}/history`
    );
    return { data: response.data, error: null };
  } catch (error) {
    return { data: null, error: parseApiError(error) };
  }
}
