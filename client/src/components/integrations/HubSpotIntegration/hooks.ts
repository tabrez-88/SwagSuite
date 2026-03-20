import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { HubSpotSyncStatus, HubSpotMetrics } from "./types";

export function useHubSpotIntegration() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [autoSync, setAutoSync] = useState(true);
  const [syncInterval, setSyncInterval] = useState("15");

  const { data: syncStatus } = useQuery<HubSpotSyncStatus>({
    queryKey: ['/api/integrations/hubspot/status'],
    refetchInterval: 30000,
  });

  const { data: metrics } = useQuery<HubSpotMetrics>({
    queryKey: ['/api/integrations/hubspot/metrics'],
    refetchInterval: 300000,
  });

  const syncMutation = useMutation({
    mutationFn: async (syncType: 'full' | 'incremental') => {
      await apiRequest('POST', '/api/integrations/hubspot/sync', { syncType });
    },
    onSuccess: () => {
      toast({
        title: "Sync Started",
        description: "HubSpot data synchronization has begun.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/integrations/hubspot/status'] });
    },
    onError: (error) => {
      toast({
        title: "Sync Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const configMutation = useMutation({
    mutationFn: async (config: { autoSync: boolean; syncInterval: number }) => {
      await apiRequest('POST', '/api/integrations/hubspot/config', config);
    },
    onSuccess: () => {
      toast({
        title: "Settings Updated",
        description: "HubSpot integration settings saved successfully.",
      });
    },
  });

  return {
    autoSync,
    setAutoSync,
    syncInterval,
    setSyncInterval,
    syncStatus,
    metrics,
    syncMutation,
    configMutation,
  };
}
