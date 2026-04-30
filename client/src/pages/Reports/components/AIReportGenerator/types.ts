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
