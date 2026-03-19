import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle, Clock, Eye, EyeOff, Mail } from "lucide-react";
import { useState } from "react";
import { MailCredentialsDialog } from "@/components/modals/MailCredentialsDialog";

export function EmailConfigTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [testingConnection, setTestingConnection] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [testEmailTo, setTestEmailTo] = useState("");
  const [mailCredentialsOpen, setMailCredentialsOpen] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ["/api/settings/integration"],
  });

  const [formData, setFormData] = useState<any>({});

  const updateSettings = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/settings/integration", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to update settings");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/settings/integration"],
      });
      toast({
        title: "Settings saved",
        description: "Email configuration has been updated.",
      });
      setFormData({});
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save settings.",
      });
    },
  });

  const testConnection = async () => {
    if (!testEmailTo || !testEmailTo.includes("@")) {
      toast({
        variant: "destructive",
        title: "Invalid Email",
        description: "Please enter a valid email address to send test email.",
      });
      return;
    }

    setTestingConnection(true);
    try {
      const response = await fetch("/api/settings/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: testEmailTo }),
        credentials: "include",
      });
      const result = await response.json();

      if (result.success) {
        toast({
          title: "Test Email Sent!",
          description: `Test email has been sent to ${testEmailTo}. Check your inbox.`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Connection failed",
          description: result.message || "Failed to send test email.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Test failed",
        description: "Unable to send test email.",
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings.mutate(formData);
  };

  const currentSettings = { ...(settings || {}), ...formData };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <Clock className="h-8 w-8 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Configuration (SMTP)
            </CardTitle>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={() => setMailCredentialsOpen(true)}
              className="bg-primary hover:bg-primary/20 text-white"
            >
              SMTP/IMAP Config
            </Button>
          </div>
          <p className="text-sm text-gray-600">
            Configure SMTP settings for sending emails to clients and vendors
            (Mailtrap, Gmail, etc.)
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* SMTP Provider Selection */}
          <div className="space-y-2">
            <Label htmlFor="emailProvider">Email Provider</Label>
            <Select
              value={currentSettings.emailProvider || "mailtrap"}
              onValueChange={(value) => {
                const updates: any = { ...formData, emailProvider: value };

                // Auto-fill SMTP settings based on provider
                if (value === "mailtrap") {
                  updates.smtpHost = "sandbox.smtp.mailtrap.io";
                  updates.smtpPort = 2525;
                } else if (value === "gmail") {
                  updates.smtpHost = "smtp.gmail.com";
                  updates.smtpPort = 587;
                } else if (value === "outlook") {
                  updates.smtpHost = "smtp-mail.outlook.com";
                  updates.smtpPort = 587;
                }

                setFormData(updates);
              }}
            >
              <SelectTrigger id="emailProvider">
                <SelectValue placeholder="Select email provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mailtrap">Mailtrap</SelectItem>
                <SelectItem value="gmail">Gmail</SelectItem>
                <SelectItem value="outlook">Outlook/Office 365</SelectItem>
                <SelectItem value="other">Other SMTP Server</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="border-t pt-6">
            <h3 className="font-semibold mb-4">SMTP Server Settings</h3>

            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* SMTP Host */}
              <div className="space-y-2">
                <Label htmlFor="smtpHost">SMTP Host</Label>
                <Input
                  id="smtpHost"
                  placeholder="smtp.mailtrap.io"
                  value={currentSettings.smtpHost || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, smtpHost: e.target.value })
                  }
                />
              </div>

              {/* SMTP Port */}
              <div className="space-y-2">
                <Label htmlFor="smtpPort">SMTP Port</Label>
                <Input
                  id="smtpPort"
                  type="number"
                  placeholder="587"
                  value={currentSettings.smtpPort || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      smtpPort: parseInt(e.target.value),
                    })
                  }
                />
              </div>
            </div>

            {/* SMTP Username */}
            <div className="space-y-2 mb-4">
              <Label htmlFor="smtpUser">SMTP Username</Label>
              <Input
                id="smtpUser"
                placeholder="your-username"
                value={currentSettings.smtpUser || ""}
                onChange={(e) =>
                  setFormData({ ...formData, smtpUser: e.target.value })
                }
              />
            </div>

            {/* SMTP Password */}
            <div className="space-y-2">
              <Label htmlFor="smtpPassword">SMTP Password</Label>
              <div className="relative">
                <Input
                  id="smtpPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="your-password"
                  value={currentSettings.smtpPassword || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, smtpPassword: e.target.value })
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                For Gmail, use an{" "}
                <a
                  href="https://support.google.com/accounts/answer/185833"
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  App Password
                </a>
              </p>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="font-semibold mb-4">Sender Information</h3>

            {/* From Address */}
            <div className="space-y-2 mb-4">
              <Label htmlFor="emailFromAddress">From Email Address</Label>
              <Input
                id="emailFromAddress"
                type="email"
                placeholder="orders@yourdomain.com"
                value={currentSettings.emailFromAddress || ""}
                onChange={(e) =>
                  setFormData({ ...formData, emailFromAddress: e.target.value })
                }
              />
              <p className="text-xs text-gray-500">
                Email address that will appear as the sender
              </p>
            </div>

            {/* From Name */}
            <div className="space-y-2">
              <Label htmlFor="emailFromName">From Name</Label>
              <Input
                id="emailFromName"
                placeholder="SwagSuite"
                value={currentSettings.emailFromName || ""}
                onChange={(e) =>
                  setFormData({ ...formData, emailFromName: e.target.value })
                }
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={updateSettings.isPending}>
              {updateSettings.isPending ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Save Settings
                </>
              )}
            </Button>
          </div>

          {/* Test Email Section */}
          <div className="pt-4 border-t">
            <Label htmlFor="testEmailTo">Test Email Recipient</Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="testEmailTo"
                type="email"
                placeholder="Enter email to receive test message"
                value={testEmailTo}
                onChange={(e) => setTestEmailTo(e.target.value)}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={testConnection}
                disabled={
                  testingConnection ||
                  !currentSettings.smtpHost ||
                  !currentSettings.smtpUser ||
                  !testEmailTo
                }
              >
                {testingConnection ? (
                  <>
                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Send Test Email
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Send a test email to verify your SMTP configuration is working
              correctly.
            </p>
          </div>
        </CardContent>
      </Card>

      <MailCredentialsDialog
        open={mailCredentialsOpen}
        onOpenChange={setMailCredentialsOpen}
      />
    </form>
  );
}
