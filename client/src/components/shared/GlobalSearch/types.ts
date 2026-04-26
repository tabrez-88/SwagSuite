export interface SearchResult {
  id: string;
  type: "order" | "product" | "company" | "contact" | "vendor" | "file" | "other";
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

export interface SearchResponse {
  results: SearchResult[];
  answer?: string;
}
