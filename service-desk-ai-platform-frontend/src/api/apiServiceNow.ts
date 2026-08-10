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

export async function apiPostServiceNowSyncIncremental(params: {
  workspace?: string;
  sinceTimestampMs?: number;
}): Promise<ApiResult<IncrementalSyncResponse>> {
  try {
    const response = await apiClient.post<IncrementalSyncResponse>(
      '/servicenow/sync/incremental',
      null,
      { params }
    );
    return { data: response.data, error: null };
  } catch (error) {
    return { data: null, error: parseApiError(error) };
  }
}

export async function apiGetAttachmentMetadata(
  attachmentId: string
): Promise<ApiResult<AttachmentMetadata>> {
  try {
    const response = await apiClient.get<AttachmentMetadata>(
      `/servicenow/attachments/metadata/${attachmentId}`
    );
    return { data: response.data, error: null };
  } catch (error) {
    return { data: null, error: parseApiError(error) };
  }
}

export function getAttachmentDownloadUrl(attachmentId: string): string {
  return `/api/v1/servicenow/attachments/download/${attachmentId}`;
}
