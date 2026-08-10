export interface SyncRequest {
  jobId?: string;
  connectorType?: string;
  syncType: 'FULL' | 'INCREMENTAL' | 'MANUAL';
  workspace?: string;
  sinceTimestamp?: string;
  batchLimit?: number;
}

export interface SyncResult {
  jobId: string;
  connectorType: string;
  syncType: string;
  status: string;
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
}

export interface ConnectorTestResult {
  connectorType: string;
  status: 'CONNECTED' | 'DISCONNECTED';
  message: string;
}
