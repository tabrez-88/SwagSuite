import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Eye, EyeOff, Mail, Loader2, ArrowLeft } from "lucide-react";
import type { MailCredentialsDialogProps } from "./types";
import { useMailCredentials } from "./hooks";

export function MailCredentialsDialog({ open, onOpenChange }: MailCredentialsDialogProps) {
  const {
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
  } = useMailCredentials(open);

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px]">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
          <DialogTitle className="text-center">Loading...</DialogTitle>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="bg-primary text-primary-foreground -mx-6 -mt-6 px-6 py-4 rounded-t-lg">
          <div className="flex items-center gap-2">
            <button onClick={() => onOpenChange(false)} className="text-primary-foreground hover:opacity-80">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <DialogTitle className="text-lg font-semibold text-primary-foreground">Mail Credentials</DialogTitle>
          </div>
          <DialogDescription className="text-primary-foreground/80 text-sm">
            Configure your personal SMTP and IMAP email settings.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* SMTP and IMAP side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* SMTP Settings */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">SMTP settings</h3>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">SMTP Server *</Label>
                <Input
                  value={formData.smtpHost}
                  onChange={(e) => updateField("smtpHost", e.target.value)}
                  placeholder="smtp.gmail.com"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">SMTP Port *</Label>
                <Input
                  type="number"
                  value={formData.smtpPort}
                  onChange={(e) => updateField("smtpPort", parseInt(e.target.value) || 0)}
                  placeholder="465"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">SMTP Username *</Label>
                <Input
                  value={formData.smtpUser}
                  onChange={(e) => updateField("smtpUser", e.target.value)}
                  placeholder="user@example.com"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">SMTP Password</Label>
                <div className="relative">
                  <Input
                    type={showSmtpPassword ? "text" : "password"}
                    value={formData.smtpPassword}
                    onChange={(e) => updateField("smtpPassword", e.target.value)}
                    placeholder="Enter password"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowSmtpPassword(!showSmtpPassword)}
                  >
                    {showSmtpPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Button variant="outline" size="sm" onClick={testSmtp} disabled={testingSmtp} className="w-full">
                {testingSmtp ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                Test SMTP
              </Button>
            </div>

            {/* IMAP Settings */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">IMAP settings</h3>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">IMAP Server *</Label>
                <Input
                  value={formData.imapHost}
                  onChange={(e) => updateField("imapHost", e.target.value)}
                  placeholder="imap.gmail.com"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">IMAP Port *</Label>
                <Input
                  type="number"
                  value={formData.imapPort}
                  onChange={(e) => updateField("imapPort", parseInt(e.target.value) || 0)}
                  placeholder="993"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">IMAP Username *</Label>
                <Input
                  value={formData.imapUser}
                  onChange={(e) => updateField("imapUser", e.target.value)}
                  placeholder="user@example.com"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">IMAP Password</Label>
                <div className="relative">
                  <Input
                    type={showImapPassword ? "text" : "password"}
                    value={formData.imapPassword}
                    onChange={(e) => updateField("imapPassword", e.target.value)}
                    placeholder="Enter password"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowImapPassword(!showImapPassword)}
                  >
                    {showImapPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Button variant="outline" size="sm" onClick={testImap} disabled={testingImap} className="w-full">
                {testingImap ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                Test IMAP
              </Button>
            </div>
          </div>

          <Separator />

          {/* Preference Checkboxes */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isPrimary"
                checked={formData.isPrimary}
                onCheckedChange={(checked) => updateField("isPrimary", !!checked)}
              />
              <Label htmlFor="isPrimary" className="text-sm cursor-pointer">
                Primary (user's default email to receive system notifications)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="useDefaultForCompose"
                checked={formData.useDefaultForCompose}
                onCheckedChange={(checked) => updateField("useDefaultForCompose", !!checked)}
              />
              <Label htmlFor="useDefaultForCompose" className="text-sm cursor-pointer">
                Always use the default account when composing new messages
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hideNameOnSend"
                checked={formData.hideNameOnSend}
                onCheckedChange={(checked) => updateField("hideNameOnSend", !!checked)}
              />
              <Label htmlFor="hideNameOnSend" className="text-sm cursor-pointer">
                Do not use my name while sending email out
              </Label>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            onClick={handleSave}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            SAVE
          </Button>
          <Button variant="destructive" onClick={() => onOpenChange(false)}>
            CLOSE
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
