import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { RefreshCw, Users, TrendingUp, CheckCircle, AlertCircle, Settings } from "lucide-react";

interface HubSpotSyncStatus {
  lastSync: string;
  status: 'active' | 'error' | 'syncing';
  recordsProcessed: number;
  errorMessage?: string;
}

interface HubSpotMetrics {
  totalContacts: number;
  pipelineDeals: number;
  monthlyRevenue: number;
  conversionRate: number;
}

export function HubSpotIntegration() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [autoSync, setAutoSync] = useState(true);
  const [syncInterval, setSyncInterval] = useState("15");

  const { data: syncStatus } = useQuery<HubSpotSyncStatus>({
    queryKey: ['/api/integrations/hubspot/status'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: metrics } = useQuery<HubSpotMetrics>({
    queryKey: ['/api/integrations/hubspot/metrics'],
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  const syncMutation = useMutation({
    mutationFn: async (syncType: 'full' | 'incremental') => {
      await apiRequest('/api/integrations/hubspot/sync', {
        method: 'POST',
        body: { syncType }
      });
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
      await apiRequest('/api/integrations/hubspot/config', {
        method: 'POST',
        body: config
      });
    },
    onSuccess: () => {
      toast({
        title: "Settings Updated",
        description: "HubSpot integration settings saved successfully.",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'syncing': return 'bg-blue-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />;
      case 'syncing': return <RefreshCw className="h-4 w-4 animate-spin" />;
      case 'error': return <AlertCircle className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${getStatusColor(syncStatus?.status || 'inactive')}`} />
              HubSpot Integration
            </CardTitle>
            <CardDescription>
              Real-time CRM synchronization and pipeline management
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon(syncStatus?.status || 'inactive')}
            <Badge variant={syncStatus?.status === 'active' ? 'default' : 'destructive'}>
              {syncStatus?.status || 'Inactive'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-muted-foreground">Last Sync</Label>
              <p className="font-medium">
                {syncStatus?.lastSync ? new Date(syncStatus.lastSync).toLocaleString() : 'Never'}
              </p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Records Processed</Label>
              <p className="font-medium">{syncStatus?.recordsProcessed || 0}</p>
            </div>
          </div>
          
          {syncStatus?.errorMessage && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{syncStatus.errorMessage}</p>
            </div>
          )}

          <div className="flex gap-2 mt-4">
            <Button 
              onClick={() => syncMutation.mutate('incremental')}
              disabled={syncMutation.isPending || syncStatus?.status === 'syncing'}
              size="sm"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Quick Sync
            </Button>
            <Button 
              variant="outline"
              onClick={() => syncMutation.mutate('full')}
              disabled={syncMutation.isPending || syncStatus?.status === 'syncing'}
              size="sm"
            >
              Full Sync
            </Button>
          </div>

          {syncStatus?.status === 'syncing' && (
            <div className="mt-4">
              <Progress value={65} className="w-full" />
              <p className="text-sm text-muted-foreground mt-2">
                Synchronizing contacts and deals...
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* HubSpot Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalContacts || 0}</div>
            <p className="text-xs text-muted-foreground">
              Active contacts in pipeline
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pipeline Deals</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.pipelineDeals || 0}</div>
            <p className="text-xs text-muted-foreground">
              Active opportunities
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${metrics?.monthlyRevenue?.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              This month's pipeline
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.conversionRate || 0}%</div>
            <p className="text-xs text-muted-foreground">
              Deal close rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Sync Settings</CardTitle>
          <CardDescription>
            Configure automatic synchronization between SwagSuite and HubSpot
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Auto Sync</Label>
              <p className="text-sm text-muted-foreground">
                Automatically sync data at regular intervals
              </p>
            </div>
            <Switch
              checked={autoSync}
              onCheckedChange={setAutoSync}
            />
          </div>

          {autoSync && (
            <div className="space-y-2">
              <Label htmlFor="sync-interval">Sync Interval (minutes)</Label>
              <Input
                id="sync-interval"
                type="number"
                value={syncInterval}
                onChange={(e) => setSyncInterval(e.target.value)}
                min="5"
                max="1440"
                className="w-32"
              />
              <p className="text-sm text-muted-foreground">
                Minimum 5 minutes, maximum 24 hours
              </p>
            </div>
          )}

          <Button 
            onClick={() => configMutation.mutate({ 
              autoSync, 
              syncInterval: parseInt(syncInterval) 
            })}
            disabled={configMutation.isPending}
          >
            Save Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}