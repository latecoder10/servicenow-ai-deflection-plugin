import { apiClient } from './client';
import {
  KnowledgeRecord,
  KnowledgeRecordsParams,
  KnowledgeSearchParams,
  KnowledgeSearchResult,
} from '../types/knowledge';
import { ApiResult } from '../types/common';
import { parseApiError } from '../utils/errorHandler';

export interface ReindexResponse {
  status: string;
  recordSysId: string;
  message: string;
}

export interface DeleteRecordResponse {
  status: string;
  vectorId: string;
  message: string;
}

export interface SyntheticDataResponse {
  status: string;
  created: number;
  resolved: number;
  failed: number;
  durationMs: number;
  message: string;
}

export async function apiGetKnowledgeSearch(
  params: KnowledgeSearchParams
): Promise<ApiResult<KnowledgeSearchResult>> {
  try {
    const response = await apiClient.get<KnowledgeSearchResult>('/knowledge/search', { params });
    return { data: response.data, error: null };
  } catch (error) {
    return { data: null, error: parseApiError(error) };
  }
}

export async function apiGetKnowledgeRecords(
  params?: KnowledgeRecordsParams
): Promise<ApiResult<KnowledgeRecord[]>> {
  try {
    const response = await apiClient.get<KnowledgeRecord[]>('/knowledge/records', { params });
    return { data: response.data, error: null };
  } catch (error) {
    return { data: null, error: parseApiError(error) };
  }
}

export async function apiPostKnowledgeReindex(
  recordSysId: string
): Promise<ApiResult<ReindexResponse>> {
  try {
    const response = await apiClient.post<ReindexResponse>(
      `/knowledge/records/${recordSysId}/reindex`
    );
    return { data: response.data, error: null };
  } catch (error) {
    return { data: null, error: parseApiError(error) };
  }
}

export async function apiDeleteKnowledgeRecord(
  recordSysId: string
): Promise<ApiResult<DeleteRecordResponse>> {
  try {
    const response = await apiClient.delete<DeleteRecordResponse>(
      `/knowledge/records/${recordSysId}`
    );
    return { data: response.data, error: null };
  } catch (error) {
    return { data: null, error: parseApiError(error) };
  }
}

export async function apiPostKnowledgeLoadSynthetic(): Promise<
  ApiResult<SyntheticDataResponse>
> {
  try {
    const response = await apiClient.post<SyntheticDataResponse>('/knowledge/load-synthetic');
    return { data: response.data, error: null };
  } catch (error) {
    return { data: null, error: parseApiError(error) };
  }
}
