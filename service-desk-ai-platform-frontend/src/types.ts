export type NavigationTab =
  | 'overview'
  | 'documents'
  | 'knowledge_articles'
  | 'resolved_incidents'
  | 'faqs_sops'
  | 'confluence_sharepoint'
  | 'servicenow_sync'
  | 'ai_search'
  | 'incident_deflection'
  | 'analytics'
  | 'servicenow_config'
  | 'ai_config'
  | 'pipeline_monitor'
  | 'users_roles'
  | 'audit_logs'
  | 'settings';

export type SourceType =
  | 'servicenow_incident'
  | 'knowledge_article'
  | 'pdf'
  | 'word'
  | 'excel'
  | 'csv'
  | 'powerpoint'
  | 'confluence'
  | 'sharepoint'
  | 'faq'
  | 'runbook'
  | 'sop'
  | 'wiki'
  | 'email_export'
  | 'zip'
  | 'folder';

export type IndexStatus = 'indexed' | 'indexing' | 'pending' | 'failed' | 'queued';

export interface KnowledgeDocument {
  id: string;
  name: string;
  sourceType: SourceType;
  department: string;
  owner: string;
  ownerAvatar?: string;
  status: IndexStatus;
  embeddingCount: number;
  chunksCount: number;
  uploadDate: string;
  lastIndexed: string;
  qualityScore: number; // 0 - 100
  fileSize: string;
  category: string;
  summary?: string;
  tags: string[];
  chunks?: { id: string; content: string; embeddingSample: number[]; tokenCount: number }[];
  contentSample?: string;
  version: string;
  versionHistory?: { version: string; date: string; author: string; changes: string }[];
}

export interface KnowledgeArticle {
  id: string;
  articleNumber: string; // e.g. KB0010942
  title: string;
  category: string;
  department: string;
  author: string;
  viewsCount: number;
  helpfulCount: number;
  rating: number; // 1-5
  lastUpdated: string;
  status: 'published' | 'draft' | 'under_review';
  content: string;
  resolutionSteps: string[];
  associatedIncidentsCount: number;
  qualityScore: number;
  tags: string[];
}

export interface ResolvedIncident {
  id: string;
  number: string; // e.g. INC098231
  shortDescription: string;
  category: string;
  priority: 'P1 - Critical' | 'P2 - High' | 'P3 - Moderate' | 'P4 - Low';
  caller: string;
  department: string;
  assignedGroup: string;
  resolvedBy: string;
  resolvedAt: string;
  resolutionCode: string;
  resolutionNotes: string;
  deflectionEligible: boolean;
  timesReused: number;
  confidenceScore: number;
}

export interface SearchResultChunk {
  chunkId: string;
  docId: string;
  docTitle: string;
  sourceType: SourceType;
  department: string;
  similarityScore: number; // 0.0 - 1.0
  text: string;
  pageNumber?: number;
  citationUrl?: string;
  metadata: Record<string, string>;
}

export interface SearchQueryResponse {
  query: string;
  aiAnswer: string;
  confidenceScore: number; // 0 - 100
  responseTimeMs: number;
  retrievedCount: number;
  rerankedCount: number;
  chunks: SearchResultChunk[];
  suggestedFollowups: string[];
  citatedSources: { title: string; type: SourceType; link?: string; id: string }[];
}

export interface IncidentDeflectionResult {
  isDeflected: boolean;
  confidenceScore: number; // 0 - 100
  matchedKbArticle?: KnowledgeArticle;
  similarIncidents: ResolvedIncident[];
  recommendedTitle: string;
  summary: string;
  stepByStepResolution: string[];
  estimatedResolutionMinutes: number;
  codeOrCommandSnippet?: string;
  category: string;
  urgencyLevel: 'Low' | 'Medium' | 'High';
}

export interface PipelineStage {
  id: string;
  name: string;
  status: 'completed' | 'processing' | 'queued' | 'failed';
  durationMs: number;
  details: string;
  itemsProcessed?: number;
  errorCount?: number;
}

export interface PipelineJob {
  id: string;
  fileName: string;
  fileSize: string;
  department: string;
  startTime: string;
  currentStage: string;
  progressPercent: number;
  stages: PipelineStage[];
  logs: { time: string; level: 'info' | 'warn' | 'error'; message: string }[];
}

export interface ServiceNowConnectionConfig {
  instanceUrl: string;
  username: string;
  authMethod: 'OAuth2' | 'Basic' | 'API Key';
  connectionStatus: 'connected' | 'disconnected' | 'testing' | 'error';
  lastSyncTime: string;
  autoSyncIncidents: boolean;
  autoSyncKnowledge: boolean;
  syncIntervalMinutes: number;
  incidentsImportedCount: number;
  kbArticlesImportedCount: number;
}

export interface AIModelConfig {
  llmProvider: 'Gemini' | 'Claude' | 'OpenAI' | 'Azure OpenAI';
  llmModelName: string;
  embeddingModel: string;
  pineconeIndexName: string;
  pineconeDimension: number;
  chunkSize: number;
  chunkOverlap: number;
  temperature: number;
  similarityThreshold: number;
  topK: number;
  systemPromptTemplate: string;
  fallbackModel: string;
}

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: 'System Admin' | 'Knowledge Manager' | 'Service Desk Lead' | 'AI Engineer' | 'Viewer';
  department: string;
  status: 'active' | 'inactive';
  lastActive: string;
  avatarUrl?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  actorRole: string;
  action: string;
  category: 'Security' | 'Knowledge' | 'Integration' | 'AI Config' | 'User Management';
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: string;
  ipAddress: string;
}

export interface MetricOverview {
  totalIncidentsAnalyzed: number;
  ticketsDeflectedCount: number;
  deflectionRatePercent: number;
  aiSuccessRatePercent: number;
  knowledgeBaseDocumentsCount: number;
  totalEmbeddingsCount: number;
  dailyAiRequests: number;
  avgResponseTimeMs: number;
  monthlyCostSavingsUSD: number;
}
