import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchNotificationPrefs, updateNotificationPrefs } from "@/services/settings/requests";
import { useToast } from "@/hooks/use-toast";

type MentionPrefs = { inApp: boolean; email: boolean; slack: boolean };

const PREFS_KEY = ["/api/users/me/notification-preferences"];

export function useNotificationsTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<{ mentions: MentionPrefs }>({
    queryKey: PREFS_KEY,
    queryFn: fetchNotificationPrefs,
  });

  const [mentions, setMentions] = useState<MentionPrefs>({ inApp: true, email: false, slack: false });

  useEffect(() => {
    if (data?.mentions) setMentions(data.mentions);
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: (next: MentionPrefs) => updateNotificationPrefs({ mentions: next }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PREFS_KEY });
      toast({ title: "Saved", description: "Notification preferences updated." });
    },
    onError: () => {
      toast({ title: "Save failed", variant: "destructive" });
    },
  });

  const handleToggle = (key: keyof MentionPrefs, checked: boolean) => {
    setMentions((prev) => ({ ...prev, [key]: checked }));
  };

  const saveSettings = () => saveMutation.mutate(mentions);

  return {
    isLoading,
    mentions,
    handleToggle,
    saveSettings,
    isSaving: saveMutation.isPending,
  };
}
