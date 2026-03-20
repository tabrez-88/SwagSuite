import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

export function useEmailConfigTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [testingConnection, setTestingConnection] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [testEmailTo, setTestEmailTo] = useState("");
  const [mailCredentialsOpen, setMailCredentialsOpen] = useState(false);
  const [formData, setFormData] = useState<any>({});

  const { data: settings, isLoading } = useQuery({
    queryKey: ["/api/settings/integration"],
  });

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

  const currentSettings = { ...(settings || {}), ...formData };

  return {
    // State
    isLoading,
    testingConnection,
    showPassword,
    testEmailTo,
    mailCredentialsOpen,
    currentSettings,
    isUpdatePending: updateSettings.isPending,

    // Test email disabled state
    isTestDisabled:
      testingConnection ||
      !currentSettings.smtpHost ||
      !currentSettings.smtpUser ||
      !testEmailTo,

    // Handlers
    handleSubmit,
    handleProviderChange,
    handleFieldChange,
    testConnection,
    toggleShowPassword,
    setTestEmailTo,
    setMailCredentialsOpen,
  };
}
