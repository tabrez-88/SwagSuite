import { useQuery } from "@tanstack/react-query";
import { newsMonitorKeys } from "./keys";
import type { NewsItem, NewsMonitorSettings } from "./types";

export function useNewsItems(search: string, sentiment: string) {
  return useQuery<NewsItem[]>({
    queryKey: newsMonitorKeys.items(search, sentiment),
    refetchInterval: 300_000,
  });
}

export function useNewsSettings() {
  return useQuery<NewsMonitorSettings>({ queryKey: newsMonitorKeys.settings });
}
