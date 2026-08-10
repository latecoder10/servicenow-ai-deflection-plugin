import { ProblemDetails } from '../types/common';
import axios from 'axios';

export function parseApiError(error: unknown): ProblemDetails {
  if (axios.isAxiosError(error)) {
    if (error.response?.data && typeof error.response.data === 'object') {
      const data = error.response.data as Partial<ProblemDetails>;
      return {
        type: data.type || 'https://servicedesk.ai/errors/general',
        title: data.title || error.response.statusText || 'API Error',
        status: data.status || error.response.status || 500,
        detail: data.detail || error.message || 'An error occurred during backend communication.',
        instance: data.instance || error.config?.url || '/api/v1',
        correlationId: data.correlationId || `err-${Date.now()}`,
        timestamp: data.timestamp || new Date().toISOString(),
      };
    }

    return {
      type: 'https://servicedesk.ai/errors/network',
      title: error.response ? `HTTP ${error.response.status}` : 'Network / Connection Error',
      status: error.response?.status || 0,
      detail: error.message || 'Failed to connect to backend server at http://localhost:8080.',
      instance: error.config?.url || '/api/v1',
      correlationId: `net-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
  }

  if (error instanceof Error) {
    return {
      type: 'https://servicedesk.ai/errors/client',
      title: 'Application Error',
      status: 500,
      detail: error.message,
      instance: '/api/v1',
      correlationId: `cli-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
  }

  return {
    type: 'https://servicedesk.ai/errors/unknown',
    title: 'Unknown Error',
    status: 500,
    detail: 'An unexpected error occurred.',
    instance: '/api/v1',
    correlationId: `unk-${Date.now()}`,
    timestamp: new Date().toISOString(),
  };
}
