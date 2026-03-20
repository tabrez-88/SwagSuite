import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { SlackMessage } from "./types";

export function useSlackPanel() {
  const [quickMessage, setQuickMessage] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: slackResponse, isLoading: statusLoading } = useQuery<{ messages: SlackMessage[] }>({
    queryKey: ['/api/slack/sync-messages'],
    refetchInterval: 30000,
    retry: false,
  });

  const messages = slackResponse?.messages || [];
  const isConnected = !!slackResponse && !statusLoading;

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

  return {
    quickMessage,
    setQuickMessage,
    isExpanded,
    setIsExpanded,
    statusLoading,
    messages,
    isConnected,
    sendMessageMutation,
    handleQuickSend,
  };
}
