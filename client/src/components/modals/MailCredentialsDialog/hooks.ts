import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { saveUserEmailSettings, testSmtpConnection, testImapConnection } from "@/services/settings/requests";
import type { MailFormData } from "./types";

const DEFAULT_FORM_DATA: MailFormData = {
  smtpHost: "",
  smtpPort: 465,
  smtpUser: "",
  smtpPassword: "",
  imapHost: "",
  imapPort: 993,
  imapUser: "",
  imapPassword: "",
  isPrimary: false,
  useDefaultForCompose: false,
  hideNameOnSend: false,
};

export function useMailCredentials(open: boolean) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showSmtpPassword, setShowSmtpPassword] = useState(false);
  const [showImapPassword, setShowImapPassword] = useState(false);
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [testingImap, setTestingImap] = useState(false);

  const { data: settings, isLoading } = useQuery<any>({
    queryKey: ["/api/user-email-settings"],
    enabled: open,
  });

  const [formData, setFormData] = useState<MailFormData>(DEFAULT_FORM_DATA);

  useEffect(() => {
    if (settings) {
      setFormData({
        smtpHost: settings.smtpHost || "",
        smtpPort: settings.smtpPort || 465,
        smtpUser: settings.smtpUser || "",
        smtpPassword: settings.smtpPassword || "",
        imapHost: settings.imapHost || "",
        imapPort: settings.imapPort || 993,
        imapUser: settings.imapUser || "",
        imapPassword: settings.imapPassword || "",
        isPrimary: settings.isPrimary || false,
        useDefaultForCompose: settings.useDefaultForCompose || false,
        hideNameOnSend: settings.hideNameOnSend || false,
      });
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: (data: MailFormData) => saveUserEmailSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user-email-settings"] });
      toast({ title: "Saved", description: "Mail credentials saved successfully." });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Error", description: "Failed to save mail credentials." });
    },
  });

  const testSmtp = async () => {
    if (!formData.smtpHost || !formData.smtpPort || !formData.smtpUser || !formData.smtpPassword) {
      toast({ variant: "destructive", title: "Missing fields", description: "Please fill in all SMTP fields." });
      return;
    }
    setTestingSmtp(true);
    try {
      const result = await testSmtpConnection({
        smtpHost: formData.smtpHost,
        smtpPort: formData.smtpPort,
        smtpUser: formData.smtpUser,
        smtpPassword: formData.smtpPassword,
      });
      toast({
        title: result.success ? "SMTP Connected" : "SMTP Failed",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
    } catch {
      toast({ variant: "destructive", title: "Error", description: "SMTP test failed." });
    } finally {
      setTestingSmtp(false);
    }
  };

  const testImap = async () => {
    if (!formData.imapHost || !formData.imapPort || !formData.imapUser || !formData.imapPassword) {
      toast({ variant: "destructive", title: "Missing fields", description: "Please fill in all IMAP fields." });
      return;
    }
    setTestingImap(true);
    try {
      const result = await testImapConnection({
        imapHost: formData.imapHost,
        imapPort: formData.imapPort,
        imapUser: formData.imapUser,
        imapPassword: formData.imapPassword,
      });
      toast({
        title: result.success ? "IMAP OK" : "IMAP Failed",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
    } catch {
      toast({ variant: "destructive", title: "Error", description: "IMAP test failed." });
    } finally {
      setTestingImap(false);
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    saveMutation.mutate(formData);
  };

  return {
    formData,
    isLoading,
    showSmtpPassword,
    setShowSmtpPassword,
    showImapPassword,
    setShowImapPassword,
    testingSmtp,
    testingImap,
    saveMutation,
    testSmtp,
    testImap,
    updateField,
    handleSave,
  };
}
