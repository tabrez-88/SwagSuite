export interface LeadSourceReport {
  source: string;
  contacts?: number;
  leads?: number;
  total?: number;
  count?: number;
  [key: string]: unknown;
}

export interface GeneratedReport {
  id: string;
  reportId: string;
  name: string;
  query: string;
  data: Record<string, unknown>[];
  summary: string;
  generatedAt: string;
  exportFormats: string[];
}

export interface ReportSuggestion {
  title: string;
  description: string;
  query: string;
  category: "sales" | "operations" | "customers" | "vendors" | "finance";
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string | null;
  query: string;
  parameters: Record<string, unknown> | null;
  schedule: string | null;
  recipients: string[] | null;
  isActive: boolean;
  createdBy: string | null;
  lastRun: string | null;
  createdAt: string;
  updatedAt: string;
}
