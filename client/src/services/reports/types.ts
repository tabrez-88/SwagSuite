export interface LeadSourceReport {
  source: string;
  contacts?: number;
  leads?: number;
  total?: number;
  count?: number;
  [key: string]: unknown;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description?: string;
  [key: string]: unknown;
}

export interface ReportSuggestion {
  id: string;
  title: string;
  [key: string]: unknown;
}

export interface GeneratedReport {
  id: string;
  content: string;
  [key: string]: unknown;
}
