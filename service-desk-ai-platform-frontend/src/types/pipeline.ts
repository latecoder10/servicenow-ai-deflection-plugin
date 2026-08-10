export interface SyncJobEntity {
  id: string;
  jobId: string;
  connectorType: string;
  syncType: 'FULL' | 'INCREMENTAL' | 'MANUAL';
  status: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  itemsFetched: number;
  itemsCreated: number;
  itemsUpdated: number;
  itemsDeleted: number;
  itemsSkipped: number;
  itemsFailed: number;
  executionTimeMs: number;
  errorMessage: string;
  startedAt: string;
  completedAt: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  softDelete: boolean;
}

export interface PipelineMetrics {
  totalJobs: number;
  runningJobs: number;
  completedJobs: number;
  failedJobs: number;
  totalRecordsIngested: number;
  totalRecordsIndexed: number;
}
