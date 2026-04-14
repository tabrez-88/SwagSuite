import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  useHubspotSyncStatus,
  useHubspotMetrics,
  useHubspotSync,
  useHubspotConfig,
} from "@/services/integrations/hubspot";

export function useHubSpotIntegration() {
  const { toast } = useToast();
  const [autoSync, setAutoSync] = useState(true);
  const [syncInterval, setSyncInterval] = useState("15");

  const { data: syncStatus } = useHubspotSyncStatus();
  const { data: metrics } = useHubspotMetrics();

  const syncMutation = useHubspotSync();
  const configMutation = useHubspotConfig();

  const triggerSync = (syncType: "full" | "incremental") => {
    syncMutation.mutate(syncType, {
      onSuccess: () => toast({ title: "Sync Started", description: "HubSpot data synchronization has begun." }),
      onError: (error: Error) =>
        toast({ title: "Sync Failed", description: error.message, variant: "destructive" }),
    });
  };

  const saveConfig = (config: { autoSync: boolean; syncInterval: number }) => {
    configMutation.mutate(config, {
      onSuccess: () => toast({ title: "Settings Updated", description: "HubSpot integration settings saved successfully." }),
    });
  };

  return {
    autoSync,
    setAutoSync,
    syncInterval,
    setSyncInterval,
    syncStatus,
    metrics,
    syncMutation,
    configMutation,
    triggerSync,
    saveConfig,
  };
}
