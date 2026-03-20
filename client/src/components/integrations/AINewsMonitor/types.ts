export interface NewsItem {
  id: string;
  headline: string;
  summary: string;
  sourceUrl: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  relevanceScore: number;
  entityType: 'company' | 'supplier' | 'industry';
  entityId?: string;
  entityName?: string;
  publishedAt: string;
  alertsSent: boolean;
}

export interface NewsMonitorSettings {
  enableCustomerNews: boolean;
  enableVendorNews: boolean;
  enableIndustryNews: boolean;
  minimumRelevanceScore: number;
  alertThreshold: number;
  autoNotifyReps: boolean;
}
