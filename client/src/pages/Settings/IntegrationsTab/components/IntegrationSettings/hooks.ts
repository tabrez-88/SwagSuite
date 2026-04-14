import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  useIntegrationConfigurations,
  useIntegrationCredentials,
  useUpdateIntegrationConfig,
  useSaveIntegrationCredentials,
  useTestIntegrationConnection,
} from "@/services/integrations/settings";
import type { IntegrationConfig, ApiCredential } from "./types";

export function useIntegrationSettings() {
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const { data: configs, isLoading: configsLoading } = useIntegrationConfigurations<IntegrationConfig[]>();
  const { data: apiCredentials, isLoading: credentialsLoading } = useIntegrationCredentials<ApiCredential[]>();

  const _updateConfig = useUpdateIntegrationConfig();
  const updateConfigMutation = {
    ..._updateConfig,
    mutate: (vars: { id: string; updates: Partial<IntegrationConfig> }) =>
      _updateConfig.mutate(vars as any, {
        onSuccess: () =>
          toast({
            title: "Configuration Updated",
            description: "Integration settings have been updated successfully.",
          }),
        onError: () =>
          toast({
            title: "Update Failed",
            description: "Failed to update integration configuration.",
            variant: "destructive",
          }),
      }),
  };

  const _saveCredentials = useSaveIntegrationCredentials();
  const saveCredentialsMutation = {
    ..._saveCredentials,
    mutate: (credentialData: Record<string, string>) =>
      _saveCredentials.mutate(credentialData, {
        onSuccess: () =>
          toast({
            title: "Credentials Saved",
            description: "API credentials have been saved successfully.",
          }),
        onError: () =>
          toast({
            title: "Save Failed",
            description: "Failed to save API credentials.",
            variant: "destructive",
          }),
      }),
  };

  const _testConnection = useTestIntegrationConnection();
  const testConnectionMutation = {
    ..._testConnection,
    mutate: (integration: string) =>
      _testConnection.mutate(integration, {
        onSuccess: (data) =>
          toast({
            title: "Connection Test Successful",
            description: data.message || "API connection is working correctly.",
          }),
        onError: () =>
          toast({
            title: "Connection Test Failed",
            description: "Unable to connect to the API. Please check your credentials.",
            variant: "destructive",
          }),
      }),
  };

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
