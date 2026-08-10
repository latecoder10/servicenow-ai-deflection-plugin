import { apiClient } from './client';
import { ResolveIncidentRequest, SuggestionResponse } from '../types/suggestion';
import { ApiResult } from '../types/common';
import { parseApiError } from '../utils/errorHandler';

export async function apiPostSuggestionsResolve(
  data: ResolveIncidentRequest
): Promise<ApiResult<SuggestionResponse>> {
  try {
    const response = await apiClient.post<SuggestionResponse>('/suggestions/resolve', data);
    return { data: response.data, error: null };
  } catch (error) {
    return { data: null, error: parseApiError(error) };
  }
}
