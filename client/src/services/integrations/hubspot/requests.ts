import { apiRequest } from "@/lib/queryClient";

export async function triggerHubspotSync(syncType: "full" | "incremental"): Promise<void> {
  await apiRequest("POST", "/api/integrations/hubspot/sync", { syncType });
}

export async function updateHubspotConfig(config: {
  autoSync: boolean;
  syncInterval: number;
}): Promise<void> {
  await apiRequest("POST", "/api/integrations/hubspot/config", config);
}
