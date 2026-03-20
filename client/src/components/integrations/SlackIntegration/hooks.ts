import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { SlackChannel, SlackMessage, SlackNotificationSettings } from "./types";

export function useSlackIntegration() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedChannel, setSelectedChannel] = useState<string>("");
  const [customMessage, setCustomMessage] = useState("");

  const { data: channels } = useQuery<SlackChannel[]>({
    queryKey: ['/api/integrations/slack/channels'],
  });

  const { data: recentMessages } = useQuery<SlackMessage[]>({
    queryKey: ['/api/integrations/slack/messages'],
    refetchInterval: 30000,
  });

  const { data: notificationSettings } = useQuery<SlackNotificationSettings>({
    queryKey: ['/api/integrations/slack/settings'],
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { channel: string; message: string }) => {
      await apiRequest('POST', '/api/integrations/slack/send', data);
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
      await apiRequest('POST', '/api/integrations/slack/settings', settings);
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

  return {
    selectedChannel,
    setSelectedChannel,
    customMessage,
    setCustomMessage,
    channels,
    recentMessages,
    notificationSettings,
    sendMessageMutation,
    updateSettingsMutation,
    handleSendMessage,
  };
}
