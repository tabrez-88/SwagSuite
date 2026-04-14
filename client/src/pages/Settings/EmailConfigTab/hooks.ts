import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import {
  useIntegrationSettings,
  useUpdateIntegrationSettings,
  useSendTestEmail,
} from "@/services/settings";

export function useEmailConfigTab() {
  const { toast } = useToast();
  const [testingConnection, setTestingConnection] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [testEmailTo, setTestEmailTo] = useState("");
  const [mailCredentialsOpen, setMailCredentialsOpen] = useState(false);
  const [formData, setFormData] = useState<any>({});

  const { data: settings, isLoading } = useIntegrationSettings();

  const _updateSettings = useUpdateIntegrationSettings();
  const _sendTestEmail = useSendTestEmail();

  const updateSettings = {
    ..._updateSettings,
    mutate: (data: any) =>
      _updateSettings.mutate(data, {
        onSuccess: () => {
          toast({ title: "Settings saved", description: "Email configuration has been updated." });
          setFormData({});
        },
        onError: () =>
          toast({ variant: "destructive", title: "Error", description: "Failed to save settings." }),
      }),
  };

  const testConnection = () => {
    if (!testEmailTo || !testEmailTo.includes("@")) {
      toast({
        variant: "destructive",
        title: "Invalid Email",
        description: "Please enter a valid email address to send test email.",
      });
      return;
    }
    setTestingConnection(true);
    _sendTestEmail.mutate(testEmailTo, {
      onSuccess: (result) => {
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
      },
      onError: () =>
        toast({
          variant: "destructive",
          title: "Test failed",
          description: "Unable to send test email.",
        }),
      onSettled: () => setTestingConnection(false),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings.mutate(formData);
  };

  const handleProviderChange = (value: string) => {
    const updates: any = { ...formData, emailProvider: value };

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
  };

  const handleFieldChange = (field: string, value: string | number) => {
    setFormData({ ...formData, [field]: value });
  };

  const toggleShowPassword = () => setShowPassword(!showPassword);

  const currentSettings = { ...((settings as any) || {}), ...formData };

  return {
    isLoading,
    testingConnection,
    showPassword,
    testEmailTo,
    mailCredentialsOpen,
    currentSettings,
    isUpdatePending: updateSettings.isPending,
    isTestDisabled:
      testingConnection ||
      !currentSettings.smtpHost ||
      !currentSettings.smtpUser ||
      !testEmailTo,
    handleSubmit,
    handleProviderChange,
    handleFieldChange,
    testConnection,
    toggleShowPassword,
    setTestEmailTo,
    setMailCredentialsOpen,
  };
}
