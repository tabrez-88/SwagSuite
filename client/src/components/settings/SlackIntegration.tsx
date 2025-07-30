import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, CheckCircle, Slack, Hash, Users, Send, Settings, MessageSquare, Bell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface SlackChannel {
  id: string;
  name: string;
  memberCount: number;
  isArchived: boolean;
}

interface SlackConfig {
  enabled: boolean;
  botToken: string;
  channelId: string;
  notifications: {
    newOrders: boolean;
    orderUpdates: boolean;
    customerMessages: boolean;
    supplierAlerts: boolean;
    teamMentions: boolean;
  };
}

export function SlackIntegration() {
  const [config, setConfig] = useState<SlackConfig>({
    enabled: false,
    botToken: "",
    channelId: "",
    notifications: {
      newOrders: true,
      orderUpdates: true,
      customerMessages: false,
      supplierAlerts: true,
      teamMentions: true,
    }
  });
  const [testMessage, setTestMessage] = useState("Hello from SwagSuite! 🎉 Integration test successful.");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch Slack channels
  const { data: channels, isLoading: channelsLoading } = useQuery<SlackChannel[]>({
    queryKey: ['/api/integrations/slack/channels'],
    enabled: config.enabled && !!config.botToken,
  });

  // Save Slack configuration
  const saveConfigMutation = useMutation({
    mutationFn: async (configData: SlackConfig) => {
      return await apiRequest('/api/integrations/slack/config', 'POST', configData);
    },
    onSuccess: () => {
      toast({
        title: "Slack Configuration Saved",
        description: "Your Slack integration settings have been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/integrations/slack/channels'] });
    },
    onError: () => {
      toast({
        title: "Save Failed",
        description: "Failed to save Slack configuration.",
        variant: "destructive",
      });
    },
  });

  // Test Slack connection
  const testConnectionMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/integrations/slack/test', 'POST', {
        message: testMessage,
        channel: config.channelId
      });
    },
    onSuccess: () => {
      toast({
        title: "Test Message Sent",
        description: "Test message sent to Slack channel successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Test Failed",
        description: "Failed to send test message. Check your configuration.",
        variant: "destructive",
      });
    },
  });

  // Send custom message
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      return await apiRequest('/api/integrations/slack/message', 'POST', {
        message,
        channel: config.channelId
      });
    },
    onSuccess: () => {
      toast({
        title: "Message Sent",
        description: "Message sent to Slack channel successfully!",
      });
      setTestMessage("");
    },
    onError: () => {
      toast({
        title: "Send Failed",
        description: "Failed to send message to Slack.",
        variant: "destructive",
      });
    },
  });

  const handleSaveConfig = () => {
    if (!config.botToken) {
      toast({
        title: "Bot Token Required",
        description: "Please enter your Slack Bot Token to save configuration.",
        variant: "destructive",
      });
      return;
    }
    saveConfigMutation.mutate(config);
  };

  const handleTestConnection = () => {
    if (!config.channelId) {
      toast({
        title: "Channel Required",
        description: "Please select a Slack channel for testing.",
        variant: "destructive",
      });
      return;
    }
    testConnectionMutation.mutate();
  };

  const handleSendMessage = () => {
    if (!testMessage.trim()) {
      toast({
        title: "Message Required",
        description: "Please enter a message to send.",
        variant: "destructive",
      });
      return;
    }
    sendMessageMutation.mutate(testMessage);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-swag-navy mb-2 flex items-center gap-2">
          <Slack className="h-6 w-6 text-purple-600" />
          Slack Integration
        </h3>
        <p className="text-muted-foreground">
          Connect SwagSuite to your Slack workspace for real-time notifications and team collaboration
        </p>
      </div>

      {/* Configuration Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Slack Configuration
          </CardTitle>
          <CardDescription>
            Set up your Slack Bot Token and default channel for notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="slackEnabled" className="text-base font-medium">
                Enable Slack Integration
              </Label>
              <p className="text-sm text-muted-foreground">
                Turn on Slack notifications and messaging
              </p>
            </div>
            <Switch
              id="slackEnabled"
              checked={config.enabled}
              onCheckedChange={(checked) => setConfig(prev => ({ ...prev, enabled: checked }))}
            />
          </div>

          {config.enabled && (
            <>
              <Separator />
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="botToken">Slack Bot Token</Label>
                  <Input
                    id="botToken"
                    type="password"
                    placeholder="xoxb-your-bot-token-here"
                    value={config.botToken}
                    onChange={(e) => setConfig(prev => ({ ...prev, botToken: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Get your bot token from <a href="https://api.slack.com/apps" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">api.slack.com/apps</a>
                  </p>
                </div>

                <div>
                  <Label htmlFor="channelId">Default Channel</Label>
                  <Select
                    value={config.channelId}
                    onValueChange={(value) => setConfig(prev => ({ ...prev, channelId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a channel..." />
                    </SelectTrigger>
                    <SelectContent>
                      {channelsLoading ? (
                        <SelectItem value="loading" disabled>Loading channels...</SelectItem>
                      ) : channels?.length ? (
                        channels.map((channel) => (
                          <SelectItem key={channel.id} value={channel.id}>
                            <div className="flex items-center gap-2">
                              <Hash className="h-3 w-3" />
                              {channel.name} ({channel.memberCount} members)
                            </div>
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>No channels available</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleSaveConfig}
                  disabled={saveConfigMutation.isPending}
                  className="bg-swag-blue hover:bg-swag-blue/90"
                >
                  {saveConfigMutation.isPending ? "Saving..." : "Save Configuration"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Notification Settings */}
      {config.enabled && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Settings
            </CardTitle>
            <CardDescription>
              Choose which events trigger Slack notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              {Object.entries({
                newOrders: "New Orders",
                orderUpdates: "Order Status Updates",
                customerMessages: "Customer Messages",
                supplierAlerts: "Supplier Alerts",
                teamMentions: "Team Mentions",
              }).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">{label}</Label>
                    <p className="text-xs text-muted-foreground">
                      Send notifications when {label.toLowerCase()} occur
                    </p>
                  </div>
                  <Switch
                    checked={config.notifications[key as keyof typeof config.notifications]}
                    onCheckedChange={(checked) => 
                      setConfig(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, [key]: checked }
                      }))
                    }
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Testing & Messaging */}
      {config.enabled && config.botToken && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Test & Send Messages
            </CardTitle>
            <CardDescription>
              Test your Slack connection and send custom messages
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="testMessage">Test Message</Label>
              <Textarea
                id="testMessage"
                placeholder="Enter your test message..."
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleTestConnection}
                disabled={testConnectionMutation.isPending || !config.channelId}
              >
                {testConnectionMutation.isPending ? "Testing..." : "Test Connection"}
              </Button>
              
              <Button
                onClick={handleSendMessage}
                disabled={sendMessageMutation.isPending || !config.channelId || !testMessage.trim()}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Send className="h-4 w-4 mr-2" />
                {sendMessageMutation.isPending ? "Sending..." : "Send Message"}
              </Button>
            </div>

            {channels && channels.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Available Channels</h4>
                <div className="grid grid-cols-2 gap-2">
                  {channels.slice(0, 6).map((channel) => (
                    <div key={channel.id} className="flex items-center gap-2 p-2 bg-muted rounded-md">
                      <Hash className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">{channel.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {channel.memberCount}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Setup Instructions */}
      {!config.enabled && (
        <Card>
          <CardHeader>
            <CardTitle>Getting Started with Slack</CardTitle>
            <CardDescription>
              Follow these steps to integrate SwagSuite with your Slack workspace
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">1. Create a Slack App</h4>
              <p className="text-xs text-muted-foreground">
                Visit <a href="https://api.slack.com/apps" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">api.slack.com/apps</a> and create a new app for your workspace.
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">2. Configure Bot Permissions</h4>
              <p className="text-xs text-muted-foreground">
                Add these OAuth scopes: <code className="bg-muted px-1 rounded">chat:write</code>, <code className="bg-muted px-1 rounded">channels:read</code>, <code className="bg-muted px-1 rounded">groups:read</code>
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">3. Install App to Workspace</h4>
              <p className="text-xs text-muted-foreground">
                Install the app to your workspace and copy the Bot User OAuth Token.
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">4. Invite Bot to Channels</h4>
              <p className="text-xs text-muted-foreground">
                Use <code className="bg-muted px-1 rounded">/invite @SwagSuite</code> to add the bot to channels where you want notifications.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}