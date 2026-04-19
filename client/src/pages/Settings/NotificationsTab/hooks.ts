import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchNotificationPrefs } from "@/services/settings/requests";
import { settingsKeys } from "@/services/settings/keys";
import { useSaveNotificationPrefs } from "@/services/settings/mutations";

type MentionPrefs = { inApp: boolean; email: boolean; slack: boolean };

export function useNotificationsTab() {
  const { data, isLoading } = useQuery<{ mentions: MentionPrefs }>({
    queryKey: settingsKeys.notificationPrefs,
    queryFn: fetchNotificationPrefs,
  });

  const [mentions, setMentions] = useState<MentionPrefs>({ inApp: true, email: false, slack: false });

  useEffect(() => {
    if (data?.mentions) setMentions(data.mentions);
  }, [data]);

  const saveMutation = useSaveNotificationPrefs();

  const handleToggle = (key: keyof MentionPrefs, checked: boolean) => {
    setMentions((prev) => ({ ...prev, [key]: checked }));
  };

  const saveSettings = () => saveMutation.mutate({ mentions });

  return {
    isLoading,
    mentions,
    handleToggle,
    saveSettings,
    isSaving: saveMutation.isPending,
  };
}
