import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { setup2FA, verifySetup2FA, disable2FA, generateBackupCodes } from "@/services/users/requests";
import type { SetupStep } from "./types";

export function useTwoFactorSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [setupStep, setSetupStep] = useState<SetupStep>("idle");
  const [qrCode, setQrCode] = useState("");
  const [manualSecret, setManualSecret] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [verifyCode, setVerifyCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [disableDialogOpen, setDisableDialogOpen] = useState(false);
  const [regenDialogOpen, setRegenDialogOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");

  const { data: twoFaStatus, isLoading } = useQuery<{ enabled: boolean }>({
    queryKey: ["/api/auth/2fa/status"],
  });

  const setupMutation = useMutation({
    mutationFn: () => setup2FA(),
    onSuccess: (data) => {
      setQrCode(data.qrCode);
      setManualSecret(data.secret);
      setSetupStep("qr");
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const verifySetupMutation = useMutation({
    mutationFn: (code: string) => verifySetup2FA(code),
    onSuccess: (data) => {
      setBackupCodes(data.backupCodes);
      setSetupStep("backup");
      queryClient.setQueryData(["/api/auth/2fa/status"], { enabled: true });
      // Don't invalidate user query here — it causes an immediate redirect
      // away from backup codes (App.tsx routes to AuthenticatedLayout when
      // twoFactorEnabled becomes true). Invalidation happens in resetSetup()
      // when the user clicks "Done" after saving their codes.
      toast({ title: "2FA Enabled", description: "Two-factor authentication has been enabled." });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Invalid Code", description: error.message });
    },
  });

  const disableMutation = useMutation({
    mutationFn: (password: string) => disable2FA(password),
    onSuccess: () => {
      setDisableDialogOpen(false);
      setPasswordInput("");
      queryClient.setQueryData(["/api/auth/2fa/status"], { enabled: false });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "2FA Disabled", description: "Two-factor authentication has been disabled." });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const regenBackupMutation = useMutation({
    mutationFn: (password: string) => generateBackupCodes(password),
    onSuccess: (data) => {
      setRegenDialogOpen(false);
      setPasswordInput("");
      setBackupCodes(data.backupCodes);
      setSetupStep("backup");
      toast({ title: "New Backup Codes", description: "Your previous codes are now invalid." });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const copyBackupCodes = () => {
    const text = backupCodes.join("\n");
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: "Backup codes copied to clipboard." });
  };

  const downloadBackupCodes = () => {
    const text = `SwagSuite 2FA Backup Codes\nGenerated: ${new Date().toLocaleDateString()}\n\n${backupCodes.map((c, i) => `${i + 1}. ${c}`).join("\n")}\n\nEach code can only be used once.\nKeep these codes safe and secure.`;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "swagsuite-backup-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetSetup = () => {
    setSetupStep("idle");
    setQrCode("");
    setManualSecret("");
    setVerifyCode("");
    setBackupCodes([]);
    setShowSecret(false);
    // Now that user has seen backup codes, refresh user data to trigger
    // proper routing (App.tsx redirects to main app when twoFactorEnabled=true)
    queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
  };

  const isEnabled = twoFaStatus?.enabled ?? false;

  return {
    setupStep,
    setSetupStep,
    qrCode,
    manualSecret,
    showSecret,
    setShowSecret,
    verifyCode,
    setVerifyCode,
    backupCodes,
    disableDialogOpen,
    setDisableDialogOpen,
    regenDialogOpen,
    setRegenDialogOpen,
    passwordInput,
    setPasswordInput,
    isLoading,
    isEnabled,
    setupMutation,
    verifySetupMutation,
    disableMutation,
    regenBackupMutation,
    copyBackupCodes,
    downloadBackupCodes,
    resetSetup,
  };
}
