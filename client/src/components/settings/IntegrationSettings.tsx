import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, CheckCircle, Database, Key, RefreshCw, Settings, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { SlackIntegration } from "./SlackIntegration";

interface IntegrationConfig {
  id: string;
  integration: string;
  displayName: string;
  description: string;
  syncEnabled: boolean;
  isHealthy: boolean;
  lastSync: string | null;
  totalSyncs: number;
  totalRecordsSynced: number;
  status: string;
  apiEndpoint: string;
  rateLimitPerHour: number;
  maxApiCallsPerHour: number;
}

interface ApiCredential {
  integration: string;
  keyName: string;
  displayName: string;
  isRequired: boolean;
  isSecret: boolean;
  value?: string;
  description: string;
}

export function IntegrationSettings() {
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

  const getStatusIcon = (isHealthy: boolean, syncEnabled: boolean) => {
    if (!syncEnabled) return <AlertCircle className="h-4 w-4 text-gray-500" />;
    return isHealthy ? 
      <CheckCircle className="h-4 w-4 text-green-600" /> : 
      <AlertCircle className="h-4 w-4 text-red-600" />;
  };

  // Group credentials by integration
  const credentialsByIntegration = apiCredentials?.reduce((acc, credential) => {
    if (!acc[credential.integration]) {
      acc[credential.integration] = [];
    }
    acc[credential.integration].push(credential);
    return acc;
  }, {} as Record<string, ApiCredential[]>) || {};

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Integration Settings - Left Side */}
      <div className="lg:col-span-2 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-swag-navy mb-2">Integration Settings</h2>
          <p className="text-muted-foreground">
            Manage ESP/ASI/SAGE database connections and API credentials
          </p>
        </div>

        {/* Integration Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {configsLoading ? (
          <div className="col-span-3 text-center py-8">Loading integrations...</div>
        ) : (
          configs?.map((config) => (
            <Card key={config.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    {config.displayName}
                  </CardTitle>
                  {getStatusIcon(config.isHealthy, config.syncEnabled)}
                </div>
                <CardDescription>{config.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Auto Sync</span>
                  <Switch
                    checked={config.syncEnabled}
                    onCheckedChange={(checked) => handleToggleSync(config.id, checked)}
                    disabled={updateConfigMutation.isPending}
                  />
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant={config.isHealthy ? "default" : "destructive"}>
                      {config.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Syncs:</span>
                    <span>{config.totalSyncs}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Records:</span>
                    <span>{config.totalRecordsSynced.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rate Limit:</span>
                    <span>{config.rateLimitPerHour}/hr</span>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => testConnectionMutation.mutate(config.integration)}
                  disabled={testConnectionMutation.isPending}
                  className="w-full"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Test Connection
                </Button>
                
                {config.integration === 'quickbooks' && (
                   <Button 
                      size="sm"
                      className="w-full mt-2"
                      onClick={async () => {
                         const res = await fetch('/api/integrations/quickbooks/auth');
                         if (res.ok) {
                            const { url } = await res.json();
                            window.location.href = url;
                         } else {
                            toast({ title: "Failed to start auth", variant: "destructive" });
                         }
                      }}
                   >
                     {config.isHealthy ? 'Reconnect QuickBooks' : 'Connect QuickBooks'}
                   </Button>
                )}
              </CardContent>
            </Card>
          ))
        )}
        </div>

        {/* API Credentials Management */}
        <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            API Credentials
          </CardTitle>
          <CardDescription>
            Configure API keys and authentication details for each integration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {credentialsLoading ? (
            <div className="text-center py-8">Loading credentials...</div>
          ) : Object.keys(credentialsByIntegration).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No credential configurations found
            </div>
          ) : (
            Object.entries(credentialsByIntegration).map(([integration, creds]) => (
              <div key={integration} className="space-y-4">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  <h3 className="font-semibold capitalize">{integration} Credentials</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {creds.map((credential) => (
                    <div key={credential.keyName} className="space-y-2">
                      <Label htmlFor={credential.keyName} className="flex items-center gap-2">
                        {credential.displayName}
                        {credential.isRequired && <span className="text-red-500">*</span>}
                      </Label>
                      <div className="relative">
                        <Input
                          id={credential.keyName}
                          type={credential.isSecret && !showSecrets[credential.keyName] ? "password" : "text"}
                          placeholder={credential.isSecret ? "••••••••••••••••" : `Enter ${credential.displayName.toLowerCase()}`}
                          value={credentials[credential.keyName] || credential.value || ""}
                          onChange={(e) => handleCredentialChange(credential.keyName, e.target.value)}
                        />
                        {credential.isSecret && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => toggleSecretVisibility(credential.keyName)}
                          >
                            {showSecrets[credential.keyName] ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </div>
                      {credential.description && (
                        <p className="text-xs text-muted-foreground">{credential.description}</p>
                      )}
                    </div>
                  ))}
                </div>
                
                <Separator />
              </div>
            ))
          )}
          
          <div className="flex justify-end">
            <Button
              onClick={handleSaveCredentials}
              disabled={saveCredentialsMutation.isPending}
              className="bg-swag-blue hover:bg-swag-blue/90"
            >
              {saveCredentialsMutation.isPending ? "Saving..." : "Save Credentials"}
            </Button>
          </div>
        </CardContent>
        </Card>

        {/* Integration Help */}
        <Card>
        <CardHeader>
          <CardTitle>Getting API Credentials</CardTitle>
          <CardDescription>
            How to obtain API keys for each promotional product database
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <h4 className="font-semibold text-blue-700">ASI (Advertising Specialty Institute)</h4>
              <p className="text-sm text-muted-foreground">
                Visit <a href="https://developers.asicentral.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">developers.asicentral.com</a> to sign up for ESP Direct Connect API access. 
                You'll need an active ASI membership to access their developer portal.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-green-700">SAGE</h4>
              <p className="text-sm text-muted-foreground">
                Contact SAGE World customer service to request API access. 
                SAGE typically charges $500-600 annually for API access to their product database.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-purple-700">Distributor Central</h4>
              <p className="text-sm text-muted-foreground">
                Access your Distributor Central account dashboard to generate API keys. 
                Basic API access is usually included with membership at no additional cost.
              </p>
            </div>
          </div>
        </CardContent>
        </Card>
        </div>

      {/* Slack Integration - Right Side */}
      <div className="lg:col-span-1">
        <SlackIntegration />
      </div>
    </div>
  );
}