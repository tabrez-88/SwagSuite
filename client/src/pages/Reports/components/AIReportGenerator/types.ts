export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  query: string;
  parameters: Record<string, any>;
  schedule?: string;
  recipients?: string[];
  isActive: boolean;
  lastRun?: string;
  createdBy: string;
  createdAt: string;
}

export interface GeneratedReport {
  id: string;
  name: string;
  query: string;
  data: any[];
  charts?: any[];
  summary: string;
  generatedAt: string;
  exportFormats: string[];
}

export interface ReportSuggestion {
  title: string;
  description: string;
  query: string;
  category: 'sales' | 'operations' | 'customers' | 'vendors' | 'finance';
}
