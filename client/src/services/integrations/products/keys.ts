export const productIntegrationKeys = {
  all: ["product-integrations"] as const,
  configurations: ["/api/integrations/configurations"] as const,
  search: (query: string, source: string, category: string) =>
    ["/api/integrations/products/search", { query, source, category }] as const,
};
