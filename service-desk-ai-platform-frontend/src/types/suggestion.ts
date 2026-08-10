export interface ResolveIncidentRequest {
  title: string;
  description: string;
  callerEmail?: string;
  userDepartment?: string;
  category?: string;
  minConfidenceThreshold?: number;
}

export interface SuggestionResponse {
  suggestionId: string;
  queryTitle: string;
  recommendedTitle: string;
  summaryResolution: string;
  stepByStepInstructions: string[];
  codeOrCommandSnippet: string;
  confidenceScore: number;
  confidenceBand: 'VERY_HIGH' | 'HIGH' | 'MEDIUM' | 'LOW';
  deflectionSuccessful: boolean;
  sourcesCount: number;
  generatedByModel: string;
  createdAt: string;
  correlationId: string;
}
