import { useQuery } from "@tanstack/react-query";
import { hubspotKeys } from "./keys";
import type { HubSpotSyncStatus, HubSpotMetrics } from "./types";

export function useHubspotSyncStatus() {
  return useQuery<HubSpotSyncStatus>({
    queryKey: hubspotKeys.status,
    refetchInterval: 30_000,
  });
}

export function useHubspotMetrics() {
  return useQuery<HubSpotMetrics>({
    queryKey: hubspotKeys.metrics,
    refetchInterval: 300_000,
  });
}
