import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Bell, Loader2, Save } from "lucide-react";
import { useNotificationsTab } from "./hooks";

const CHANNEL_COPY: Record<"inApp" | "email" | "slack", { label: string; description: string }> = {
  inApp: { label: "In-app", description: "Show mention notifications in the bell menu." },
  email: { label: "Email", description: "Also send an email when someone @mentions you in a note." },
  slack: { label: "Slack", description: "Forward mention alerts to Slack (requires Slack integration)." },
};

export function NotificationsTab() {
  const { mentions, handleToggle, saveSettings, isSaving, isLoading } = useNotificationsTab();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Notification Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-sm font-semibold mb-1">@Mentions in Internal Notes</h3>
          <p className="text-xs text-gray-600 mb-4">
            Choose how you want to be notified when a teammate tags you (@name) in a project's internal notes.
          </p>
          <div className="space-y-4">
            {(["inApp", "email", "slack"] as const).map((key) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <Label htmlFor={`mention-${key}`} className="text-sm font-medium">{CHANNEL_COPY[key].label}</Label>
                  <p className="text-xs text-gray-600">{CHANNEL_COPY[key].description}</p>
                </div>
                <Switch
                  id={`mention-${key}`}
                  checked={mentions[key]}
                  disabled={isLoading}
                  onCheckedChange={(checked) => handleToggle(key, checked)}
                />
              </div>
            ))}
          </div>
        </div>
        <Button onClick={saveSettings} disabled={isSaving || isLoading} className="w-full">
          {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Notification Settings
        </Button>
      </CardContent>
    </Card>
  );
}
