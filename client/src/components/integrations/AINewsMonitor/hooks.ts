import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  useNewsItems,
  useNewsSettings,
  useUpdateNewsSettings,
  useToggleNewsAlert,
  useSendNewsAlert,
} from "@/services/integrations/news-monitor";

export function useAINewsMonitor() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSentiment, setSelectedSentiment] = useState<string>("all");

  const { data: newsItems } = useNewsItems(searchQuery, selectedSentiment);
  const { data: settings } = useNewsSettings();

  const updateSettingsMutation = useUpdateNewsSettings();
  const toggleAlertMutation = useToggleNewsAlert();
  const sendManualAlertMutation = useSendNewsAlert();

  const saveSettings = (next: Parameters<typeof updateSettingsMutation.mutate>[0]) => {
    updateSettingsMutation.mutate(next, {
      onSuccess: () => toast({ title: "Settings Updated", description: "News monitoring settings saved successfully." }),
    });
  };

  const sendAlert = (newsId: string) => {
    sendManualAlertMutation.mutate(newsId, {
      onSuccess: () => toast({ title: "Alert Sent", description: "News alert has been sent to relevant team members." }),
    });
  };

  const filteredNews = newsItems?.filter((item) => {
    if (selectedSentiment !== "all" && item.sentiment !== selectedSentiment) return false;
    if (
      searchQuery &&
      !item.headline.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !item.entityName?.toLowerCase().includes(searchQuery.toLowerCase())
    ) return false;
    return true;
  });

  return {
    searchQuery,
    setSearchQuery,
    selectedSentiment,
    setSelectedSentiment,
    settings,
    filteredNews,
    updateSettingsMutation,
    toggleAlertMutation,
    sendManualAlertMutation,
    saveSettings,
    sendAlert,
  };
}
