import { apiClient } from './client';
import { CreateIncidentRequest, Incident } from '../types/incident';
import { AttachmentMetadata } from '../types/attachment';
import { ApiResult } from '../types/common';
import { parseApiError } from '../utils/errorHandler';

export interface ServiceNowHealthResponse {
  status: string;
  instance: string;
  authMode: string;
  systemOfRecord: string;
}

export interface IncrementalSyncResponse {
  status: string;
  jobId: string;
  message: string;
}

export async function apiPostServiceNowIncidents(
  data: CreateIncidentRequest
): Promise<ApiResult<Incident>> {
  try {
    const response = await apiClient.post<Incident>('/servicenow/incidents', data);
    return { data: response.data, error: null };
  } catch (error) {
    return { data: null, error: parseApiError(error) };
  }
}

export async function apiGetServiceNowHealth(): Promise<ApiResult<ServiceNowHealthResponse>> {
  try {
    const response = await apiClient.get<ServiceNowHealthResponse>('/servicenow/health');
    return { data: response.data, error: null };
  } catch (error) {
    return { data: null, error: parseApiError(error) };
  }
}

/*
 * Removed: apiPostServiceNowSyncIncremental, apiGetAttachmentMetadata and
 * getAttachmentDownloadUrl.
 *
 * None of the three had an endpoint behind it. Synchronisation deliberately lives on
 * the connector API (/connectors/{type}/sync) so every knowledge source is triggered
 * the same way, and the two attachment routes were never implemented. Attachment
 * records already carry an absolute downloadUrl from the ServiceNow adapter, so the
 * UI links to that directly.
 */
