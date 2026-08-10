import { apiClient } from './client';
import { KnowledgeDocumentEntity, UploadJobEntity } from '../types/file';
import { ApiResult } from '../types/common';
import { parseApiError } from '../utils/errorHandler';

export async function apiPostFileUpload(
  formData: FormData,
  onUploadProgress?: (progressEvent: { loaded: number; total?: number }) => void
): Promise<ApiResult<UploadJobEntity>> {
  try {
    const response = await apiClient.post<UploadJobEntity>('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (e) => {
        if (onUploadProgress) {
          onUploadProgress({ loaded: e.loaded, total: e.total });
        }
      },
    });
    return { data: response.data, error: null };
  } catch (error) {
    return { data: null, error: parseApiError(error) };
  }
}

export async function apiGetUploadJob(jobId: string): Promise<ApiResult<UploadJobEntity>> {
  try {
    const response = await apiClient.get<UploadJobEntity>(`/files/jobs/${jobId}`);
    return { data: response.data, error: null };
  } catch (error) {
    return { data: null, error: parseApiError(error) };
  }
}

export async function apiGetFiles(): Promise<ApiResult<KnowledgeDocumentEntity[]>> {
  try {
    const response = await apiClient.get<KnowledgeDocumentEntity[]>('/files');
    return { data: response.data, error: null };
  } catch (error) {
    return { data: null, error: parseApiError(error) };
  }
}

export function getDownloadDocumentUrl(documentId: string): string {
  return `/api/v1/files/${documentId}/download`;
}
