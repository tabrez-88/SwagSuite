import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { SlackChannel, SlackConfig } from "./types";

export function useSlackIntegration() {
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

  return {
    config,
    setConfig,
    testMessage,
    setTestMessage,
    channels,
    channelsLoading,
    saveConfigMutation,
    testConnectionMutation,
    sendMessageMutation,
    handleSaveConfig,
    handleTestConnection,
    handleSendMessage,
  };
}
