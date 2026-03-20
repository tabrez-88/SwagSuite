import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { NewsItem, NewsMonitorSettings } from "./types";

export function useAINewsMonitor() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSentiment, setSelectedSentiment] = useState<string>("all");

  const { data: newsItems } = useQuery<NewsItem[]>({
    queryKey: ['/api/integrations/news/items', { search: searchQuery, sentiment: selectedSentiment }],
    refetchInterval: 300000,
  });

  const { data: settings } = useQuery<NewsMonitorSettings>({
    queryKey: ['/api/integrations/news/settings'],
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: Partial<NewsMonitorSettings>) => {
      await apiRequest('POST', '/api/integrations/news/settings', newSettings);
    },
    onSuccess: () => {
      toast({
        title: "Settings Updated",
        description: "News monitoring settings saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/integrations/news/settings'] });
    },
  });

  const toggleAlertMutation = useMutation({
    mutationFn: async (newsId: string) => {
      await apiRequest('POST', `/api/integrations/news/${newsId}/toggle-alert`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/integrations/news/items'] });
    },
  });

  const sendManualAlertMutation = useMutation({
    mutationFn: async (newsId: string) => {
      await apiRequest('POST', `/api/integrations/news/${newsId}/send-alert`);
    },
    onSuccess: () => {
      toast({
        title: "Alert Sent",
        description: "News alert has been sent to relevant team members.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/integrations/news/items'] });
    },
  });

  const filteredNews = newsItems?.filter(item => {
    if (selectedSentiment !== 'all' && item.sentiment !== selectedSentiment) return false;
    if (searchQuery && !item.headline.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !item.entityName?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
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
  };
}
