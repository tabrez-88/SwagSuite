import { useQuery } from "@tanstack/react-query";
import { productIntegrationKeys } from "./keys";
import type { IntegrationConfig, ProductSearchResponse } from "./types";

export function useIntegrationConfigurations() {
  return useQuery<IntegrationConfig[]>({ queryKey: productIntegrationKeys.configurations });
}

export function useProductIntegrationSearch(
  query: string,
  source: string,
  category: string,
  enabled = false,
) {
  return useQuery<ProductSearchResponse>({
    queryKey: productIntegrationKeys.search(query, source, category),
    enabled,
  });
}
