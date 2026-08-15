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

/** One bucket of the deflection trend: a day, or an hour when granularity is HOUR. */
export interface DeflectionTrendPoint {
  /** ISO timestamp of the bucket start. */
  bucket: string;
  queries: number;
  deflected: number;
  confirmed: number;
  /** Share of queries the engine answered above the confidence threshold. */
  deflectionRatePercent: number;
  /** Share an agent confirmed actually solved the problem. The honest number. */
  confirmedRatePercent: number;
  averageConfidence: number;
}

export interface DeflectionTrendResponse {
  granularity: 'DAY' | 'HOUR';
  windowDays: number;
  pointCount: number;
  points: DeflectionTrendPoint[];
  /** False when there is only one bucket, i.e. not yet a trend. */
  sufficientForTrend: boolean;
}
