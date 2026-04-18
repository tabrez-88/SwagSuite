export const mockupBuilderKeys = {
  all: ["mockup-builder"] as const,
  search: (q: string) => ["/api/mockup-builder/products/search", { q }] as const,
  templates: ["/api/mockup-builder/templates"] as const,
};
