import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  ShieldCheck,
  ShieldOff,
  KeyRound,
  Loader2,
  Copy,
  Download,
  Eye,
  EyeOff,
} from "lucide-react";

type SetupStep = "idle" | "qr" | "verify" | "backup";

export default function TwoFactorSettings() {
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
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/2fa/setup");
      return res.json();
    },
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
    mutationFn: async (code: string) => {
      const res = await apiRequest("POST", "/api/auth/2fa/verify-setup", { code });
      return res.json();
    },
    onSuccess: (data) => {
      setBackupCodes(data.backupCodes);
      setSetupStep("backup");
      queryClient.setQueryData(["/api/auth/2fa/status"], { enabled: true });
      toast({ title: "2FA Enabled", description: "Two-factor authentication has been enabled." });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Invalid Code", description: error.message });
    },
  });

  const disableMutation = useMutation({
    mutationFn: async (password: string) => {
      const res = await apiRequest("POST", "/api/auth/2fa/disable", { password });
      return res.json();
    },
    onSuccess: () => {
      setDisableDialogOpen(false);
      setPasswordInput("");
      queryClient.setQueryData(["/api/auth/2fa/status"], { enabled: false });
      toast({ title: "2FA Disabled", description: "Two-factor authentication has been disabled." });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const regenBackupMutation = useMutation({
    mutationFn: async (password: string) => {
      const res = await apiRequest("POST", "/api/auth/2fa/backup-codes", { password });
      return res.json();
    },
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
  };

  if (isLoading) return null;

  const isEnabled = twoFaStatus?.enabled ?? false;

  return (
    <>
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShieldCheck className="h-5 w-5" />
                Two-Factor Authentication
              </CardTitle>
              <CardDescription className="mt-1">
                Add an extra layer of security to your account
              </CardDescription>
            </div>
            <Badge variant={isEnabled ? "default" : "secondary"} className={isEnabled ? "bg-green-100 text-green-700 border-green-200" : ""}>
              {isEnabled ? "Enabled" : "Disabled"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* Idle state — show enable/disable */}
          {setupStep === "idle" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {isEnabled
                  ? "Your account is protected with two-factor authentication using an authenticator app."
                  : "Protect your account by requiring a verification code from your authenticator app when signing in."}
              </p>
              <div className="flex gap-2">
                {!isEnabled ? (
                  <Button onClick={() => setupMutation.mutate()} disabled={setupMutation.isPending}>
                    {setupMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                    Enable 2FA
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" onClick={() => setRegenDialogOpen(true)}>
                      <KeyRound className="mr-2 h-4 w-4" />
                      Regenerate Backup Codes
                    </Button>
                    <Button variant="destructive" onClick={() => setDisableDialogOpen(true)}>
                      <ShieldOff className="mr-2 h-4 w-4" />
                      Disable 2FA
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* QR Code step */}
          {setupStep === "qr" && (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                </p>
                {qrCode && (
                  <div className="inline-block bg-white p-4 rounded-lg border">
                    <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Manual Entry Code</Label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-muted px-3 py-2 rounded text-sm font-mono break-all">
                    {showSecret ? manualSecret : "••••••••••••••••••••••••••••••••"}
                  </code>
                  <Button variant="ghost" size="icon" onClick={() => setShowSecret(!showSecret)}>
                    {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      navigator.clipboard.writeText(manualSecret);
                      toast({ title: "Copied", description: "Secret copied to clipboard." });
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={resetSetup}>Cancel</Button>
                <Button onClick={() => setSetupStep("verify")}>
                  Next: Verify Code
                </Button>
              </div>
            </div>
          )}

          {/* Verify step */}
          {setupStep === "verify" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Enter the 6-digit code from your authenticator app to confirm setup.
              </p>
              <div className="max-w-xs">
                <Label htmlFor="verify-code">Verification Code</Label>
                <Input
                  id="verify-code"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ""))}
                  className="mt-1 text-center font-mono text-lg tracking-widest"
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setSetupStep("qr")}>Back</Button>
                <Button
                  onClick={() => verifySetupMutation.mutate(verifyCode)}
                  disabled={verifyCode.length !== 6 || verifySetupMutation.isPending}
                >
                  {verifySetupMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Verify & Enable
                </Button>
              </div>
            </div>
          )}

          {/* Backup codes step */}
          {setupStep === "backup" && backupCodes.length > 0 && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm font-medium text-amber-800 mb-1">Save your backup codes</p>
                <p className="text-xs text-amber-700">
                  These codes can be used to sign in if you lose access to your authenticator app.
                  Each code can only be used once. Store them somewhere safe.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-muted p-4 rounded-lg">
                {backupCodes.map((code, i) => (
                  <code key={i} className="text-sm font-mono text-center py-1">
                    {code}
                  </code>
                ))}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={copyBackupCodes}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy
                </Button>
                <Button variant="outline" onClick={downloadBackupCodes}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
                <Button onClick={resetSetup} className="ml-auto">
                  Done
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Disable 2FA Dialog */}
      <AlertDialog open={disableDialogOpen} onOpenChange={setDisableDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disable Two-Factor Authentication?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the extra security layer from your account. Enter your password to confirm.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Label htmlFor="disable-password">Password</Label>
            <Input
              id="disable-password"
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Enter your password"
              className="mt-1"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPasswordInput("")}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => disableMutation.mutate(passwordInput)}
              disabled={!passwordInput || disableMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {disableMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Disable 2FA
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Regenerate Backup Codes Dialog */}
      <Dialog open={regenDialogOpen} onOpenChange={(open) => { setRegenDialogOpen(open); if (!open) setPasswordInput(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Regenerate Backup Codes</DialogTitle>
            <DialogDescription>
              This will generate new backup codes and invalidate all previous ones. Enter your password to confirm.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Label htmlFor="regen-password">Password</Label>
            <Input
              id="regen-password"
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Enter your password"
              className="mt-1"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRegenDialogOpen(false); setPasswordInput(""); }}>
              Cancel
            </Button>
            <Button
              onClick={() => regenBackupMutation.mutate(passwordInput)}
              disabled={!passwordInput || regenBackupMutation.isPending}
            >
              {regenBackupMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Generate New Codes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
