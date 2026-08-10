export interface UploadJobEntity {
  id: string;
  documentId: string;
  filename: string;
  status: string;
  progressPercentage: number;
  errorMessage: string;
  retryCount: number;
  startedAt: string;
  finishedAt: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  softDelete: boolean;
}

export interface KnowledgeDocumentEntity {
  id: string;
  workspaceId: string;
  departmentId: string;
  categoryId: string;
  sourceId: string;
  title: string;
  sourceType: string;
  storagePath: string;
  originalFilename: string;
  mimeType: string;
  fileSizeBytes: number;
  checksum: string;
  qualityScore: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  softDelete: boolean;
}

export type UploadedFile = KnowledgeDocumentEntity;
