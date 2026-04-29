import { apiRequest } from "@/lib/queryClient";

export type EntityType = "order" | "product" | "company" | "contact" | "vendor" | "purchase_order" | "shipment" | "activity";

export interface AdvancedSearchParams {
  q: string;
  limit?: number;
  offset?: number;
  entityTypes?: EntityType[];
  stage?: string;
  marginMin?: number;
  marginMax?: number;
  dateFrom?: string;
  dateTo?: string;
  industry?: string;
}

export interface AggregationResult {
  value: number;
  label: string;
  breakdown?: Array<{ key: string; value: number }>;
}

export interface AdvancedSearchResponse {
  results: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    metadata: Record<string, any>;
    url: string;
  }>;
  total: number;
  facets: Record<string, number>;
  answer?: string;
  aggregation?: AggregationResult;
}

export async function advancedSearch(params: AdvancedSearchParams): Promise<AdvancedSearchResponse> {
  const searchParams = new URLSearchParams();
  searchParams.set("q", params.q);
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.offset) searchParams.set("offset", String(params.offset));
  if (params.entityTypes?.length) searchParams.set("entityTypes", params.entityTypes.join(","));
  if (params.stage) searchParams.set("stage", params.stage);
  if (params.marginMin !== undefined) searchParams.set("marginMin", String(params.marginMin));
  if (params.marginMax !== undefined) searchParams.set("marginMax", String(params.marginMax));
  if (params.dateFrom) searchParams.set("dateFrom", params.dateFrom);
  if (params.dateTo) searchParams.set("dateTo", params.dateTo);
  if (params.industry) searchParams.set("industry", params.industry);

  const res = await apiRequest("GET", `/api/search/advanced?${searchParams.toString()}`);
  return res.json();
}
