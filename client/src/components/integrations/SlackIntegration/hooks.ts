import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  useSlackChannels,
  useSlackMessages,
  useSlackSettings,
  useSendSlackMessage,
  useUpdateSlackSettings,
} from "@/services/integrations/slack";

export function useSlackIntegration() {
  const { toast } = useToast();
  const [selectedChannel, setSelectedChannel] = useState<string>("");
  const [customMessage, setCustomMessage] = useState("");

  const { data: channels } = useSlackChannels();
  const { data: recentMessages } = useSlackMessages();
  const { data: notificationSettings } = useSlackSettings();

  const sendMessageMutation = useSendSlackMessage();
  const updateSettingsMutation = useUpdateSlackSettings();

  const handleSendMessage = () => {
    if (!selectedChannel || !customMessage.trim()) {
      toast({
        title: "Missing Information",
        description: "Please select a channel and enter a message.",
        variant: "destructive",
      });
      return;
    }

    sendMessageMutation.mutate(
      { channel: selectedChannel, message: customMessage },
      {
        onSuccess: () => {
          toast({ title: "Message Sent", description: "Your message has been sent to Slack successfully." });
          setCustomMessage("");
        },
        onError: (error: Error) => {
          toast({ title: "Send Failed", description: error.message, variant: "destructive" });
        },
      },
    );
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
