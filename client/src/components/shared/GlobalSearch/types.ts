export interface SearchResult {
  id: string;
  type: "order" | "product" | "company" | "contact" | "file" | "other";
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
