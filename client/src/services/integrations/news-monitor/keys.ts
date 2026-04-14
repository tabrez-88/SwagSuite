export const newsMonitorKeys = {
  all: ["news-monitor"] as const,
  items: (search: string, sentiment: string) =>
    ["/api/integrations/news/items", { search, sentiment }] as const,
  settings: ["/api/integrations/news/settings"] as const,
};
