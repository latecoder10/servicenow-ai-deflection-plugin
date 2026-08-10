export interface DeflectionMetrics {
  totalIncidentsAnalyzed: number;
  ticketsDeflectedCount: number;
  deflectionRatePercent: number;
  monthlyCostSavingsUSD: number;
  knowledgeBaseDocumentsCount: number;
  totalEmbeddingsCount: number;
  averageConfidenceScore: number;
  averageResolutionTimeSeconds: number;
  calculatedAt: string;
}

export interface DashboardResponse {
  serviceNowConnection: {
    status: string;
    instanceUrl: string;
    authType: string;
    lastSyncTimestamp: string;
  };
  knowledgeIndexStats: {
    totalEmbeddingsInPinecone: number;
    activePineconeIndex: string;
  };
  deflectionMetrics: {
    totalIncidentsAnalyzed: number;
    ticketsDeflectedCount: number;
    deflectionRatePercent: number;
    monthlyCostSavingsUSD: number;
  };
}
