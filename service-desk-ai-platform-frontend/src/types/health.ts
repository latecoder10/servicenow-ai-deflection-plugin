export interface HealthResponse {
  status: string;
  timestamp: string;
  service: string;
  version: string;
  pineconeStatus: string;
  servicenowStatus: string;
}

export interface HealthReadinessResponse {
  status: string;
  components: {
    pinecone: boolean;
    gemini: boolean;
    serviceNow: boolean;
  };
}

export interface SystemMetrics {
  uptimeSeconds: number;
  memoryUsageMb: number;
}
