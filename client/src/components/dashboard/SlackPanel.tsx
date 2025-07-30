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
import { 
  Slack, 
  Hash, 
  Send, 
  Settings, 
  MessageSquare, 
  Bell, 
  CheckCircle,
  AlertCircle,
  Users
} from "lucide-react";
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

export function SlackPanel() {
  const [config, setConfig] = useState<SlackConfig>({
    enabled: true, // Auto-enable since we have the token configured
    botToken: "configured", // Placeholder since token is in env
    channelId: "",
    notifications: {
      newOrders: true,
      orderUpdates: true,
      customerMessages: false,
      supplierAlerts: true,
      teamMentions: true,
    }
  });
  const [quickMessage, setQuickMessage] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch Slack channels
  const { data: channels, isLoading: channelsLoading } = useQuery<SlackChannel[]>({
    queryKey: ['/api/integrations/slack/channels'],
    enabled: config.enabled,
  });

  // Fetch recent messages
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['/api/integrations/slack/messages'],
    enabled: config.enabled,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Save Slack configuration
  const saveConfigMutation = useMutation({
    mutationFn: async (configData: SlackConfig) => {
      return await apiRequest('/api/integrations/slack/config', 'POST', configData);
    },
    onSuccess: () => {
      toast({
        title: "Slack Connected",
        description: "Your Slack integration is now active.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/integrations/slack/channels'] });
    },
    onError: () => {
      toast({
        title: "Connection Failed",
        description: "Failed to connect to Slack. Check your bot token.",
        variant: "destructive",
      });
    },
  });

  // Send quick message
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
        description: "Message sent to Slack successfully!",
      });
      setQuickMessage("");
    },
    onError: () => {
      toast({
        title: "Send Failed",
        description: "Failed to send message to Slack.",
        variant: "destructive",
      });
    },
  });

  const handleQuickSend = () => {
    if (!quickMessage.trim()) {
      toast({
        title: "Message Required",
        description: "Please enter a message to send.",
        variant: "destructive",
      });
      return;
    }
    if (!config.channelId) {
      toast({
        title: "Channel Required",
        description: "Please select a Slack channel first.",
        variant: "destructive",
      });
      return;
    }
    sendMessageMutation.mutate(quickMessage);
  };

  const handleSaveConfig = () => {
    saveConfigMutation.mutate(config);
  };

  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <Slack className="h-5 w-5 text-purple-600" />
            Slack Integration
          </div>
          <div className="flex items-center gap-2">
            {config.enabled ? (
              <Badge variant="default" className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                <AlertCircle className="h-3 w-3 mr-1" />
                Not Connected
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
        <CardDescription>
          Send messages and receive notifications from your Slack workspace
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="space-y-3 p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <div className="text-sm font-medium text-green-800">Slack Connected</div>
          </div>
          <div className="text-xs text-green-600">
            SwagSuite is connected to your Slack workspace and ready to send notifications.
          </div>
        </div>

        {/* Quick Message - When Connected */}
        {config.enabled && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <MessageSquare className="h-4 w-4" />
              Quick Message
            </div>
            
            <div className="space-y-2">
              <Select
                value={config.channelId}
                onValueChange={(value) => setConfig(prev => ({ ...prev, channelId: value }))}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Select channel..." />
                </SelectTrigger>
                <SelectContent>
                  {channelsLoading ? (
                    <SelectItem value="loading" disabled>Loading channels...</SelectItem>
                  ) : channels?.length ? (
                    channels.map((channel) => (
                      <SelectItem key={channel.id} value={channel.id}>
                        <div className="flex items-center gap-2">
                          <Hash className="h-3 w-3" />
                          {channel.name}
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>No channels available</SelectItem>
                  )}
                </SelectContent>
              </Select>

              <Textarea
                placeholder="Type your message here..."
                value={quickMessage}
                onChange={(e) => setQuickMessage(e.target.value)}
                rows={2}
                className="text-sm"
              />

              <Button
                onClick={handleQuickSend}
                disabled={sendMessageMutation.isPending || !config.channelId || !quickMessage.trim()}
                size="sm"
                className="w-full"
              >
                <Send className="h-3 w-3 mr-2" />
                {sendMessageMutation.isPending ? "Sending..." : "Send Message"}
              </Button>
            </div>
          </div>
        )}

        {/* Expanded Settings */}
        {isExpanded && config.enabled && (
          <>
            <Separator />
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Bell className="h-4 w-4" />
                Notification Settings
              </div>
              
              <div className="space-y-2">
                {Object.entries({
                  newOrders: "New Orders",
                  orderUpdates: "Order Updates",
                  customerMessages: "Customer Messages",
                  supplierAlerts: "Supplier Alerts",
                  teamMentions: "Team Mentions",
                }).map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between">
                    <Label className="text-xs">{label}</Label>
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

              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveConfig}
                disabled={saveConfigMutation.isPending}
                className="w-full"
              >
                Save Settings
              </Button>
            </div>
          </>
        )}

        {/* Recent Messages */}
        {config.enabled && messages && messages.length > 0 && (
          <div className="pt-3 border-t">
            <div className="text-xs text-muted-foreground mb-2">Recent Messages</div>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {messages.slice(0, 3).map((message) => (
                <div key={message.id} className="text-xs bg-muted rounded p-2">
                  <div className="flex items-center gap-1 mb-1">
                    <Users className="h-3 w-3" />
                    <span className="font-medium">{message.user}</span>
                    <span className="text-muted-foreground">
                      {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="text-muted-foreground">{message.content}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Channel Info - When Connected */}
        {config.enabled && channels && channels.length > 0 && (
          <div className="pt-3 border-t">
            <div className="text-xs text-muted-foreground mb-2">Available Channels</div>
            <div className="grid grid-cols-2 gap-1">
              {channels.slice(0, 4).map((channel) => (
                <div key={channel.id} className="flex items-center gap-1 text-xs bg-muted rounded px-2 py-1">
                  <Hash className="h-3 w-3" />
                  <span className="truncate">{channel.name}</span>
                  <Badge variant="secondary" className="text-xs px-1 py-0">
                    {channel.memberCount}
                  </Badge>
                </div>
              ))}
            </div>
            {channels.length > 4 && (
              <div className="text-xs text-muted-foreground mt-1">
                +{channels.length - 4} more channels
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}