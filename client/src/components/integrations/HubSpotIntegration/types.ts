export interface HubSpotSyncStatus {
  lastSync: string;
  status: 'active' | 'error' | 'syncing';
  recordsProcessed: number;
  errorMessage?: string;
}

export interface HubSpotMetrics {
  totalContacts: number;
  pipelineDeals: number;
  monthlyRevenue: number;
  conversionRate: number;
}
