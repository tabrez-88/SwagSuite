import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Bell, Save } from "lucide-react";
import { useState } from "react";

export function NotificationsTab() {
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

  const saveSettings = () => {
    toast({
      title: "Settings Saved",
      description: "Notification settings have been saved successfully.",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Notification Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(notifications).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between">
            <div>
              <Label
                htmlFor={key}
                className="text-sm font-medium capitalize"
              >
                {key.replace(/([A-Z])/g, " $1").trim()}
              </Label>
              <p className="text-xs text-gray-600">
                {key === "emailNotifications" &&
                  "Receive notifications via email"}
                {key === "slackNotifications" &&
                  "Send alerts to configured Slack channels"}
                {key === "orderUpdates" &&
                  "Get notified when orders change status"}
                {key === "customerUpdates" &&
                  "Alerts for new customers and updates"}
                {key === "supplierUpdates" &&
                  "Notifications about supplier changes"}
                {key === "marketingEmails" &&
                  "Receive marketing and promotional emails"}
                {key === "weeklyReports" &&
                  "Weekly performance and analytics reports"}
                {key === "instantAlerts" &&
                  "Immediate notifications for urgent items"}
                {key === "dailyDigest" &&
                  "Daily summary of all activities"}
              </p>
            </div>
            <Switch
              id={key}
              checked={value}
              onCheckedChange={(checked) =>
                setNotifications((prev) => ({ ...prev, [key]: checked }))
              }
            />
          </div>
        ))}
        <Button
          onClick={saveSettings}
          className="w-full"
        >
          <Save className="w-4 h-4 mr-2" />
          Save Notification Settings
        </Button>
      </CardContent>
    </Card>
  );
}
