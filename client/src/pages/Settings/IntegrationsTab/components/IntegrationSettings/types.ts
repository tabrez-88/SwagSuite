export interface IntegrationConfig {
  id: string;
  integration: string;
  displayName: string;
  description: string;
  syncEnabled: boolean;
  isHealthy: boolean;
  lastSync: string | null;
  totalSyncs: number;
  totalRecordsSynced: number;
  status: string;
  apiEndpoint: string;
  rateLimitPerHour: number;
  maxApiCallsPerHour: number;
}

export interface ApiCredential {
  integration: string;
  keyName: string;
  displayName: string;
  isRequired: boolean;
  isSecret: boolean;
  value?: string;
  description: string;
}
