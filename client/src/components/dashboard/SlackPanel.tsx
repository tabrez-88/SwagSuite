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

interface SlackMessage {
  id: string;
  messageId: string;
  userId?: string;
  username?: string;
  content?: string;
  timestamp?: string;
  createdAt: string;
  replyCount?: number;
}

interface SlackStatus {
  configured: boolean;
  connected: boolean;
  channelId?: string;
}

export function SlackPanel() {
  const [quickMessage, setQuickMessage] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check Slack connection status
  const { data: slackResponse, isLoading: statusLoading } = useQuery<{ messages: SlackMessage[] }>({
    queryKey: ['/api/slack/sync-messages'],
    refetchInterval: 30000, // Refresh every 30 seconds
    retry: false,
  });

  const messages = slackResponse?.messages || [];
  const isConnected = !!slackResponse && !statusLoading;

  // Send quick message
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      return await apiRequest('/api/slack/send-message', 'POST', { content });
    },
    onSuccess: () => {
      toast({
        title: "Message Sent",
        description: "Message sent to Slack successfully!",
      });
      setQuickMessage("");
      queryClient.invalidateQueries({ queryKey: ['/api/slack/sync-messages'] });
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
    sendMessageMutation.mutate(quickMessage);
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
            {isConnected ? (
              <Badge variant="default" className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                <AlertCircle className="h-3 w-3 mr-1" />
                {statusLoading ? "Checking..." : "Not Connected"}
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
        {/* Connection Status - Not Connected */}
        {!isConnected && !statusLoading && (
          <div className="space-y-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <div className="text-sm font-medium text-yellow-800">Slack Not Configured</div>
            </div>
            <div className="text-xs text-yellow-700 space-y-2">
              <div>To enable Slack integration, add these environment variables:</div>
              <div className="font-mono bg-yellow-100 p-2 rounded">
                SLACK_BOT_TOKEN=xoxb-...<br />
                SLACK_CHANNEL_ID=C...
              </div>
              <div className="font-medium mt-2">Setup Instructions:</div>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Go to <a href="https://api.slack.com/apps" target="_blank" rel="noopener noreferrer" className="underline text-blue-600">api.slack.com/apps</a></li>
                <li>Create or select your SwagSuite app</li>
                <li>Go to "OAuth & Permissions" → Copy "Bot User OAuth Token" (xoxb-...)</li>
                <li>Add scopes: chat:write, channels:read, channels:history, users:read</li>
                <li>Find Channel ID from Slack channel details</li>
                <li>Restart the application</li>
              </ol>
            </div>
          </div>
        )}

        {/* Quick Message - When Connected */}
        {isConnected && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <MessageSquare className="h-4 w-4" />
              Quick Message
            </div>
            
            <div className="space-y-2">
              <Textarea
                placeholder="Type your message here..."
                value={quickMessage}
                onChange={(e) => setQuickMessage(e.target.value)}
                rows={2}
                className="text-sm"
              />

              <Button
                onClick={handleQuickSend}
                disabled={sendMessageMutation.isPending || !quickMessage.trim()}
                size="sm"
                className="w-full"
              >
                <Send className="h-3 w-3 mr-2" />
                {sendMessageMutation.isPending ? "Sending..." : "Send Message"}
              </Button>
            </div>
          </div>
        )}

        {/* Recent Messages */}
        {isConnected && messages && messages.length > 0 && (
          <div className="pt-3 border-t">
            <div className="text-xs text-muted-foreground mb-2">Recent Messages</div>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {messages.slice(0, 3).map((message) => (
                <div key={message.id} className="text-xs bg-muted rounded p-2">
                  <div className="flex items-center gap-1 mb-1">
                    <Users className="h-3 w-3" />
                    <span className="font-medium">{message.username || 'Unknown'}</span>
                    <span className="text-muted-foreground">
                      {new Date(message.timestamp || message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="text-muted-foreground">{message.content}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}