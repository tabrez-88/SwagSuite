import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  useSlackSyncMessages,
  usePostSlackLiveMessage,
} from "@/services/integrations/slack";
import type { SlackMessage } from "./types";

export function useSlackPanel() {
  const [quickMessage, setQuickMessage] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const { toast } = useToast();

  const { data: slackResponse, isLoading: statusLoading } = useSlackSyncMessages<{
    messages: SlackMessage[];
  }>();

  const messages = slackResponse?.messages || [];
  const isConnected = !!slackResponse && !statusLoading;

  const _sendMessage = usePostSlackLiveMessage();
  const sendMessageMutation = {
    ..._sendMessage,
    mutate: (content: string) =>
      _sendMessage.mutate(content, {
        onSuccess: () => {
          toast({ title: "Message Sent", description: "Message sent to Slack successfully!" });
          setQuickMessage("");
        },
        onError: () =>
          toast({
            title: "Send Failed",
            description: "Failed to send message to Slack.",
            variant: "destructive",
          }),
      }),
  };

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
