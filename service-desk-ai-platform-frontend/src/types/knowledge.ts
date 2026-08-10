import { AttachmentMetadata } from './attachment';

export interface KnowledgeRecord {
  id: string;
  recordSysId: string;
  recordNumber: string;
  title: string;
  description: string;
  resolutionNotes: string;
  workNotes: string;
  comments: string;
  category: string;
  subcategory: string;
  priority: string;
  assignmentGroup: string;
  configurationItem: string;
  relatedServices: string;
  workspace: string;
  department: string;
  recordType: 'INCIDENT' | 'KNOWLEDGE_ARTICLE';
  state: string;
  connectorType: string;
  sysCreatedOn: string;
  sysUpdatedOn: string;
  attachments: AttachmentMetadata[];
}

export interface KnowledgeSearchParams {
  query: string;
  workspace?: string;
  category?: string;
  topK?: number;
}

export interface KnowledgeSearchResult {
  query: string;
  workspace?: string;
  category?: string;
  topK?: number;
  results: Array<{
    id?: string;
    score?: number;
    title?: string;
    snippet?: string;
    metadata?: Record<string, unknown>;
  }>;
}

export interface KnowledgeRecordsParams {
  daysBack?: number;
  limit?: number;
  offset?: number;
}
