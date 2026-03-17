import { useState, forwardRef, useImperativeHandle, useEffect, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/RichTextEditor";
import { Send, Eye, Edit, Loader2 } from "lucide-react";
import EmailContactPicker from "./EmailContactPicker";
import EmailPreview from "./EmailPreview";
import { useEmailForm } from "./useEmailForm";
import { useAutoFillSender } from "./useAutoFillSender";
import type { EmailContact, EmailFormData, EmailFormField } from "./types";

export interface EmailComposerProps {
  /** Initial/default values */
  defaults?: Partial<EmailFormData>;
  /** Contact list for checkbox selection */
  contacts?: EmailContact[];
  /** Show From, CC, BCC fields (default: true) */
  showAdvancedFields?: boolean;
  /** Use RichTextEditor vs plain Textarea */
  richText?: boolean;
  /** Show Compose/Preview toggle */
  showPreview?: boolean;
  /** Auto-fill From from current user */
  autoFillSender?: boolean;
  /** Slot above recipients (e.g., vendor selector) */
  beforeRecipients?: ReactNode;
  /** Slot above body field (e.g., proof thumbnails) */
  beforeBody?: ReactNode;
  /** Slot below body field (e.g., reminder config) */
  afterBody?: ReactNode;
  /** Hint text below body (e.g., "PDF will be attached") */
  footerHint?: string;
  /** Called with form data on send */
  onSend: (data: EmailFormData & { adHocEmails: string[] }) => void;
  /** Whether send is in progress */
  isSending?: boolean;
  /** Custom send button label */
  sendLabel?: string;
  /** Cancel handler (shows Cancel button if provided) */
  onCancel?: () => void;
  /** Reset form when this value changes to truthy */
  resetTrigger?: any;
  /** CSS class */
  className?: string;
}

export interface EmailComposerRef {
  setField: (field: EmailFormField, value: string) => void;
  reset: (defaults?: Partial<EmailFormData>) => void;
  getFormData: () => EmailFormData & { adHocEmails: string[] };
}

const EmailComposer = forwardRef<EmailComposerRef, EmailComposerProps>(function EmailComposer({
  defaults,
  contacts,
  showAdvancedFields = true,
  richText = false,
  showPreview = false,
  autoFillSender = true,
  beforeRecipients,
  beforeBody,
  afterBody,
  footerHint,
  onSend,
  isSending = false,
  sendLabel = "Send Email",
  onCancel,
  resetTrigger,
  className,
}, ref) {
  const { form, setField, toggleContact, reset } = useEmailForm({
    defaults,
    contacts,
    resetTrigger,
  });

  const [adHocEmails, setAdHocEmails] = useState<string[]>([]);
  const [mode, setMode] = useState<"compose" | "preview">("compose");

  // Reset ad-hoc emails when trigger changes
  useEffect(() => {
    if (resetTrigger) {
      setAdHocEmails([]);
      setMode("compose");
    }
  }, [resetTrigger]);

  // Auto-fill sender
  const sender = useAutoFillSender();
  useEffect(() => {
    if (autoFillSender && sender.email && !form.from) {
      setField("from", sender.email);
      setField("fromName", sender.name);
    }
  }, [autoFillSender, sender, form.from, setField]);

  const hasContacts = contacts && contacts.length > 0;
  const contactsWithEmail = contacts?.filter((c) => c.email) || [];

  // Build recipient strings for display and sending
  const getRecipientEmails = (): string => {
    const emails: string[] = [];
    if (hasContacts) {
      for (const c of contactsWithEmail) {
        if (form.selectedContactIds.has(c.id)) {
          emails.push(c.email!);
        }
      }
    } else if (form.to) {
      emails.push(form.to);
    }
    emails.push(...adHocEmails);
    return emails.join(", ");
  };

  const getRecipientNames = (): string => {
    const names: string[] = [];
    if (hasContacts) {
      for (const c of contactsWithEmail) {
        if (form.selectedContactIds.has(c.id)) {
          names.push(`${c.firstName} ${c.lastName}`);
        }
      }
    } else if (form.toName) {
      names.push(form.toName);
    }
    return names.join(", ");
  };

  const getFormDataWithAdHoc = () => ({
    ...form,
    to: getRecipientEmails(),
    toName: getRecipientNames(),
    adHocEmails,
  });

  // Expose ref methods
  useImperativeHandle(ref, () => ({
    setField,
    reset,
    getFormData: getFormDataWithAdHoc,
  }));

  const handleSend = () => {
    const recipientEmails = getRecipientEmails();
    if (!recipientEmails) return;
    onSend(getFormDataWithAdHoc());
  };

  const recipientDisplay = hasContacts
    ? (() => {
        const selected = contactsWithEmail.filter((c) => form.selectedContactIds.has(c.id));
        const parts = selected.map((c) => `${c.firstName} ${c.lastName} <${c.email}>`);
        parts.push(...adHocEmails);
        return parts.join(", ");
      })()
    : undefined;

  return (
    <div className={className}>
      {showPreview && (
        <div className="flex gap-1 mb-4">
          <Button
            variant={mode === "compose" ? "default" : "ghost"}
            size="sm"
            onClick={() => setMode("compose")}
          >
            <Edit className="w-3 h-3 mr-1" />
            Compose
          </Button>
          <Button
            variant={mode === "preview" ? "default" : "ghost"}
            size="sm"
            onClick={() => setMode("preview")}
          >
            <Eye className="w-3 h-3 mr-1" />
            Preview
          </Button>
        </div>
      )}

      {mode === "compose" ? (
        <div className="space-y-4">
          {beforeRecipients}

          {/* Recipients */}
          {hasContacts ? (
            <EmailContactPicker
              contacts={contacts!}
              selectedIds={form.selectedContactIds}
              onToggle={toggleContact}
              adHocEmails={adHocEmails}
              onAdHocChange={setAdHocEmails}
            />
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>To *</Label>
                <Input
                  value={form.to}
                  onChange={(e) => setField("to", e.target.value)}
                  placeholder="recipient@example.com"
                />
              </div>
              <div>
                <Label>To Name</Label>
                <Input
                  value={form.toName}
                  onChange={(e) => setField("toName", e.target.value)}
                  placeholder="Recipient name"
                />
              </div>
            </div>
          )}

          {/* From fields */}
          {showAdvancedFields && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>From</Label>
                  <Input
                    value={form.from}
                    onChange={(e) => setField("from", e.target.value)}
                  />
                </div>
                <div>
                  <Label>From Name</Label>
                  <Input
                    value={form.fromName}
                    onChange={(e) => setField("fromName", e.target.value)}
                  />
                </div>
              </div>

              {/* CC / BCC */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>CC</Label>
                  <Input
                    value={form.cc}
                    onChange={(e) => setField("cc", e.target.value)}
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <Label>BCC</Label>
                  <Input
                    value={form.bcc}
                    onChange={(e) => setField("bcc", e.target.value)}
                    placeholder="Optional"
                  />
                </div>
              </div>
            </>
          )}

          {/* Subject */}
          <div>
            <Label>Subject *</Label>
            <Input
              value={form.subject}
              onChange={(e) => setField("subject", e.target.value)}
              placeholder="Email subject"
            />
          </div>

          {/* Before body slot */}
          {beforeBody}

          {/* Body */}
          <div>
            <Label>Message *</Label>
            {richText ? (
              <RichTextEditor
                value={form.body}
                onChange={(val) => setField("body", val)}
                placeholder="Compose your email..."
              />
            ) : (
              <Textarea
                value={form.body}
                onChange={(e) => setField("body", e.target.value)}
                className="min-h-[140px] resize-none text-sm"
                placeholder="Compose your email..."
              />
            )}
            {footerHint && (
              <p className="text-xs text-gray-400 mt-1">{footerHint}</p>
            )}
          </div>

          {/* After body slot */}
          {afterBody}
        </div>
      ) : (
        <EmailPreview form={form} recipientDisplay={recipientDisplay} />
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4">
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button
          onClick={handleSend}
          disabled={isSending || !getRecipientEmails()}
          className="gap-1"
        >
          {isSending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          {isSending ? "Sending..." : sendLabel}
        </Button>
      </div>
    </div>
  );
});

export default EmailComposer;
