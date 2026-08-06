export interface ConnectorStatus {
  connectorType: string;
  displayName: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ERROR';
  instanceUrl: string;
  supportedRecords: string[];
  lastSyncAt: string;
}

export interface SyncJob {
  jobId: string;
  connectorType: string;
  syncType: 'FULL' | 'INCREMENTAL';
  status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  itemsFetched: number;
  itemsCreated?: number;
  itemsUpdated?: number;
  itemsSkipped?: number;
  itemsFailed?: number;
  executionTimeMs?: number;
  startedAt: string;
  completedAt?: string;
  errorMessage?: string;
}

export interface KnowledgeRecord {
  recordSysId: string;
  recordNumber: string;
  title: string;
  description: string;
  resolutionNotes: string;
  category: string;
  priority: string;
  department: string;
  recordType: 'INCIDENT' | 'KNOWLEDGE_ARTICLE';
  state: string;
  connectorType: string;
  sysCreatedOn: string;
  sysUpdatedOn: string;
}

export interface AttachmentMetadata {
  attachmentSysId: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  tableName: string;
  recordSysId: string;
  downloadUrl: string;
}

export interface DeflectionSuggestion {
  suggestionId: string;
  queryTitle: string;
  recommendedTitle: string;
  summaryResolution: string;
  summary?: string;
  stepByStepInstructions: string[];
  codeOrCommandSnippet?: string;
  confidenceScore: number;
  confidenceBand: 'VERY_HIGH' | 'HIGH' | 'MEDIUM' | 'LOW';
  deflectionSuccessful: boolean;
  sourcesCount: number;
  category: string;
  urgencyLevel: string;
  estimatedResolutionMinutes: number;
  preventativeTip?: string;
  createdAt: string;
}

export interface DashboardMetrics {
  serviceNowConnection: {
    status: string;
    instanceUrl: string;
    authType: string;
    lastSyncTimestamp: string;
  };
  knowledgeIndexStats: {
    totalIncidentsIndexed: number;
    totalKbArticlesIndexed: number;
    totalEmbeddingsInPinecone: number;
    activePineconeIndex: string;
    knowledgeGrowthRatePercent: number;
  };
  deflectionMetrics: {
    totalIncidentsAnalyzed: number;
    ticketsDeflectedCount: number;
    deflectionRatePercent: number;
    monthlyCostSavingsUSD: number;
    aiAccuracyScorePercent: number;
  };
  pipelineHealth: {
    pendingSyncJobs: number;
    failedSyncJobs: number;
    averageSyncDurationSeconds: number;
    activeConnector: string;
  };
  recentSearches: Array<{
    query: string;
    deflected: boolean;
    confidence: number;
  }>;
}
