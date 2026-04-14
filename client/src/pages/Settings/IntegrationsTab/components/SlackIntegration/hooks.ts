import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  useSlackChannels,
  useSaveSlackConfig,
  useTestSlackConnection,
  useSendSlackChannelMessage,
} from "@/services/integrations/slack";
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

  const { data: channels, isLoading: channelsLoading } = useSlackChannels() as unknown as {
    data: SlackChannel[] | undefined;
    isLoading: boolean;
  };

  const _saveConfig = useSaveSlackConfig();
  const saveConfigMutation = {
    ..._saveConfig,
    mutate: (configData: SlackConfig) =>
      _saveConfig.mutate(configData as unknown as Record<string, unknown>, {
        onSuccess: () =>
          toast({
            title: "Slack Configuration Saved",
            description: "Your Slack integration settings have been saved successfully.",
          }),
        onError: () =>
          toast({
            title: "Save Failed",
            description: "Failed to save Slack configuration.",
            variant: "destructive",
          }),
      }),
  };

  const _testConnection = useTestSlackConnection();
  const testConnectionMutation = {
    ..._testConnection,
    mutate: () =>
      _testConnection.mutate(
        { message: testMessage, channel: config.channelId },
        {
          onSuccess: () =>
            toast({
              title: "Test Message Sent",
              description: "Test message sent to Slack channel successfully!",
            }),
          onError: () =>
            toast({
              title: "Test Failed",
              description: "Failed to send test message. Check your configuration.",
              variant: "destructive",
            }),
        },
      ),
  };

  const _sendMessage = useSendSlackChannelMessage();
  const sendMessageMutation = {
    ..._sendMessage,
    mutate: (message: string) =>
      _sendMessage.mutate(
        { message, channel: config.channelId },
        {
          onSuccess: () => {
            toast({
              title: "Message Sent",
              description: "Message sent to Slack channel successfully!",
            });
            setTestMessage("");
          },
          onError: () =>
            toast({
              title: "Send Failed",
              description: "Failed to send message to Slack.",
              variant: "destructive",
            }),
        },
      ),
  };

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
