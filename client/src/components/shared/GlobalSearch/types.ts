export interface SearchResult {
  id: string;
  type: "order" | "product" | "company" | "contact" | "vendor" | "purchase_order" | "shipment" | "activity" | "file" | "other";
  title: string;
  description: string;
  metadata?: {
    margin?: string;
    value?: string;
    status?: string;
    date?: string;
    [key: string]: any;
  };
  url?: string;
}

export interface AggregationResult {
  value: number;
  label: string;
  breakdown?: Array<{ key: string; value: number }>;
}

export interface SearchResponse {
  results: SearchResult[];
  answer?: string;
  aggregation?: AggregationResult;
}
