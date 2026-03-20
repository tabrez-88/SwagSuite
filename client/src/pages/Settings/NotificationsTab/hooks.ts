import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export function useNotificationsTab() {
  const { toast } = useToast();

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    slackNotifications: true,
    orderUpdates: true,
    customerUpdates: true,
    supplierUpdates: false,
    marketingEmails: true,
    weeklyReports: true,
    instantAlerts: true,
    dailyDigest: true,
  });

  const handleToggle = (key: string, checked: boolean) => {
    setNotifications((prev) => ({ ...prev, [key]: checked }));
  };

  const saveSettings = () => {
    toast({
      title: "Settings Saved",
      description: "Notification settings have been saved successfully.",
    });
  };

  return {
    notifications,
    handleToggle,
    saveSettings,
  };
}
