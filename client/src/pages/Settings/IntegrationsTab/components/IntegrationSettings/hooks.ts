import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { IntegrationConfig, ApiCredential } from "./types";

export function useIntegrationSettings() {
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch integration configurations
  const { data: configs, isLoading: configsLoading } = useQuery<IntegrationConfig[]>({
    queryKey: ['/api/integrations/configurations'],
  });

  // Fetch API credentials
  const { data: apiCredentials, isLoading: credentialsLoading } = useQuery<ApiCredential[]>({
    queryKey: ['/api/integrations/credentials'],
    retry: false,
  });

  // Update configuration mutation
  const updateConfigMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<IntegrationConfig> }) => {
      const response = await apiRequest('PATCH', `/api/integrations/configurations/${id}`, updates);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Configuration Updated",
        description: "Integration settings have been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/integrations/configurations'] });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update integration configuration.",
        variant: "destructive",
      });
    },
  });

  // Save credentials mutation
  const saveCredentialsMutation = useMutation({
    mutationFn: async (credentialData: Record<string, string>) => {
      const response = await apiRequest('POST', '/api/integrations/credentials', credentialData);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Credentials Saved",
        description: "API credentials have been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/integrations/credentials'] });
      queryClient.invalidateQueries({ queryKey: ['/api/integrations/configurations'] });
    },
    onError: () => {
      toast({
        title: "Save Failed",
        description: "Failed to save API credentials.",
        variant: "destructive",
      });
    },
  });

  // Test connection mutation
  const testConnectionMutation = useMutation({
    mutationFn: async (integration: string) => {
      const response = await apiRequest('POST', `/api/integrations/${integration}/test`);
      return await response.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Connection Test Successful",
        description: data.message || "API connection is working correctly.",
      });
    },
    onError: () => {
      toast({
        title: "Connection Test Failed",
        description: "Unable to connect to the API. Please check your credentials.",
        variant: "destructive",
      });
    },
  });

  const handleToggleSync = (configId: string, enabled: boolean) => {
    updateConfigMutation.mutate({
      id: configId,
      updates: { syncEnabled: enabled }
    });
  };

  const handleCredentialChange = (keyName: string, value: string) => {
    setCredentials(prev => ({
      ...prev,
      [keyName]: value
    }));
  };

  const handleSaveCredentials = () => {
    saveCredentialsMutation.mutate(credentials);
  };

  const toggleSecretVisibility = (keyName: string) => {
    setShowSecrets(prev => ({
      ...prev,
      [keyName]: !prev[keyName]
    }));
  };

  const getStatusColor = (isHealthy: boolean, syncEnabled: boolean) => {
    if (!syncEnabled) return 'text-gray-500';
    return isHealthy ? 'text-green-600' : 'text-red-600';
  };

  // Group credentials by integration
  const credentialsByIntegration = apiCredentials?.reduce((acc, credential) => {
    if (!acc[credential.integration]) {
      acc[credential.integration] = [];
    }
    acc[credential.integration].push(credential);
    return acc;
  }, {} as Record<string, ApiCredential[]>) || {};

  return {
    showSecrets,
    credentials,
    configs,
    configsLoading,
    apiCredentials,
    credentialsLoading,
    updateConfigMutation,
    saveCredentialsMutation,
    testConnectionMutation,
    handleToggleSync,
    handleCredentialChange,
    handleSaveCredentials,
    toggleSecretVisibility,
    getStatusColor,
    credentialsByIntegration,
    toast,
  };
}
