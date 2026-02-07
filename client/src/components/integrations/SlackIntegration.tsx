import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { MessageSquare, Send, Users, Hash, CheckCircle, AlertTriangle } from "lucide-react";

interface SlackChannel {
  id: string;
  name: string;
  memberCount: number;
  isArchived: boolean;
}

interface SlackMessage {
  id: string;
  content: string;
  user: string;
  timestamp: string;
  channel: string;
}

interface SlackNotificationSettings {
  orderUpdates: boolean;
  customerAlerts: boolean;
  vendorReminders: boolean;
  teamAnnouncements: boolean;
  errorAlerts: boolean;
  defaultChannel: string;
}

export function SlackIntegration() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedChannel, setSelectedChannel] = useState<string>("");
  const [customMessage, setCustomMessage] = useState("");

  const { data: channels } = useQuery<SlackChannel[]>({
    queryKey: ['/api/integrations/slack/channels'],
  });

  const { data: recentMessages } = useQuery<SlackMessage[]>({
    queryKey: ['/api/integrations/slack/messages'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: notificationSettings } = useQuery<SlackNotificationSettings>({
    queryKey: ['/api/integrations/slack/settings'],
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { channel: string; message: string }) => {
      await apiRequest('/api/integrations/slack/send', {
        method: 'POST',
        body: data
      });
    },
    onSuccess: () => {
      toast({
        title: "Message Sent",
        description: "Your message has been sent to Slack successfully.",
      });
      setCustomMessage("");
      queryClient.invalidateQueries({ queryKey: ['/api/integrations/slack/messages'] });
    },
    onError: (error) => {
      toast({
        title: "Send Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (settings: Partial<SlackNotificationSettings>) => {
      await apiRequest('/api/integrations/slack/settings', {
        method: 'POST',
        body: settings
      });
    },
    onSuccess: () => {
      toast({
        title: "Settings Updated",
        description: "Slack notification settings saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/integrations/slack/settings'] });
    },
  });

  const handleSendMessage = () => {
    if (!selectedChannel || !customMessage.trim()) {
      toast({
        title: "Missing Information",
        description: "Please select a channel and enter a message.",
        variant: "destructive",
      });
      return;
    }

    sendMessageMutation.mutate({
      channel: selectedChannel,
      message: customMessage
    });
  };

  return (
    <div className="space-y-6">
      {/* Team Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Team Activity Feed
          </CardTitle>
          <CardDescription>
            Recent team communication and system notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-80 w-full">
            <div className="space-y-3">
              {recentMessages?.map((message) => (
                <div key={message.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-swag-blue rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {message.user.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{message.user}</span>
                      <Hash className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{message.channel}</span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {new Date(message.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{message.content}</p>
                  </div>
                </div>
              )) || (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No recent messages</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Quick Message Sender */}
      <Card>
        <CardHeader>
          <CardTitle>Send Team Message</CardTitle>
          <CardDescription>
            Send messages directly to Slack channels from SwagSuite
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="channel-select">Channel</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {channels?.map((channel) => (
                <Button
                  key={channel.id}
                  variant={selectedChannel === channel.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedChannel(channel.id)}
                  className="justify-start"
                  disabled={channel.isArchived}
                >
                  <Hash className="h-4 w-4 mr-2" />
                  {channel.name}
                  {channel.isArchived && (
                    <Badge variant="secondary" className="ml-2">Archived</Badge>
                  )}
                </Button>
              )) || (
                <p className="text-sm text-muted-foreground col-span-full">
                  No channels available
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message-content">Message</Label>
            <Textarea
              id="message-content"
              placeholder="Type your message here..."
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={3}
            />
          </div>

          <Button 
            onClick={handleSendMessage}
            disabled={sendMessageMutation.isPending || !selectedChannel || !customMessage.trim()}
            className="w-full"
          >
            <Send className="h-4 w-4 mr-2" />
            Send Message
          </Button>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Settings</CardTitle>
          <CardDescription>
            Configure automatic Slack notifications for system events
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: 'orderUpdates', label: 'Order Updates', icon: CheckCircle },
              { key: 'customerAlerts', label: 'Customer Alerts', icon: Users },
              { key: 'vendorReminders', label: 'Vendor Reminders', icon: AlertTriangle },
              { key: 'teamAnnouncements', label: 'Team Announcements', icon: MessageSquare },
              { key: 'errorAlerts', label: 'Error Alerts', icon: AlertTriangle },
            ].map(({ key, label, icon: Icon }) => (
              <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{label}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateSettingsMutation.mutate({
                    [key]: !(notificationSettings as any)?.[key]
                  })}
                >
                  {(notificationSettings as any)?.[key] ? 'Enabled' : 'Disabled'}
                </Button>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t">
            <Label>Default Notification Channel</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
              {channels?.filter(c => !c.isArchived).map((channel) => (
                <Button
                  key={channel.id}
                  variant={notificationSettings?.defaultChannel === channel.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateSettingsMutation.mutate({
                    defaultChannel: channel.id
                  })}
                  className="justify-start"
                >
                  <Hash className="h-4 w-4 mr-2" />
                  {channel.name}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}