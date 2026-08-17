export const API_BASE_URL = '/api/v1';

export const APP_NAME = 'Estuate Service Desk';
export const APP_VERSION = '1.0.0-enterprise';

export const DEFAULT_PAGE_SIZE = 10;
export const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100MB

export const CONFIDENCE_BANDS = {
  VERY_HIGH: { label: 'Very High', color: 'success', minScore: 90 },
  HIGH: { label: 'High', color: 'info', minScore: 75 },
  MEDIUM: { label: 'Medium', color: 'warning', minScore: 50 },
  LOW: { label: 'Low', color: 'error', minScore: 0 },
} as const;

export const SYNC_TYPES = ['FULL', 'INCREMENTAL', 'MANUAL'] as const;

export const JOB_STATUS_COLORS = {
  RUNNING: '#2196f3',
  COMPLETED: '#28a745',
  FAILED: '#d73a49',
  CANCELLED: '#6c757d',
  PROCESSING: '#2196f3',
  READY: '#28a745',
} as const;
