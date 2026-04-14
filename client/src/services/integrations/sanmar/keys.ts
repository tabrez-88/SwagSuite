export const sanmarKeys = {
  all: ["sanmar"] as const,
  search: (q: string) => ["/api/sanmar/search", { q }] as const,
};
