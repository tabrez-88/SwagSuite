import { useState, forwardRef, useImperativeHandle, useEffect, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/shared/RichTextEditor";
import { Send, Eye, Edit, Loader2, Paperclip, X, FileText } from "lucide-react";
import EmailAutocompleteInput from "./EmailAutocompleteInput";
import EmailContactPicker from "./EmailContactPicker";
import EmailPreview from "./EmailPreview";
import TemplateSelector from "./TemplateSelector";
import FilePickerDialog from "@/components/modals/FilePickerDialog";
import { FilePreviewModal } from "@/components/modals/FilePreviewModal";
import { useEmailForm } from "./useEmailForm";
import { useAutoFillSender } from "./useAutoFillSender";
import type { EmailContact, EmailFormData, EmailFormField, EmailAttachment } from "./types";

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
  /** Show attachment picker button (default: false) */
  showAttachments?: boolean;
  /** Project ID for file picker context (shows "Project Files" tab) */
  contextProjectId?: string;
  /** Template type for template selector (e.g. 'quote', 'invoice') */
  templateType?: string;
  /** Merge data for template field replacement */
  templateMergeData?: Record<string, string>;
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
  showAttachments = false,
  contextProjectId,
  templateType,
  templateMergeData,
  onSend,
  isSending = false,
  sendLabel = "Send Email",
  onCancel,
  resetTrigger,
  className,
}, ref) {
  const { form, setField, toggleContact, reset, addAttachments, removeAttachment } = useEmailForm({
    defaults,
    contacts,
    resetTrigger,
  });

  const [adHocEmails, setAdHocEmails] = useState<string[]>([]);
  const [mode, setMode] = useState<"compose" | "preview">("compose");
  const [showFilePicker, setShowFilePicker] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState<EmailAttachment | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  // Reset ad-hoc emails and template selection when trigger changes
  useEffect(() => {
    if (resetTrigger) {
      setAdHocEmails([]);
      setMode("compose");
      setSelectedTemplateId(null);
    }
  }, [resetTrigger]);

  // Handle template selection — update subject and body fields
  const handleTemplateApply = (applied: { subject: string; body: string } | null) => {
    if (applied) {
      setField("subject", applied.subject);
      setField("body", applied.body);
    } else {
      // Reset to defaults when "No template" selected
      setField("subject", defaults?.subject || "");
      setField("body", defaults?.body || "");
    }
  };

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
                <EmailAutocompleteInput
                  value={form.to}
                  onChange={(v) => setField("to", v)}
                  placeholder="Search contacts or type email..."
                  multiple={false}
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



          {/* From fields — optional */}
          {showAdvancedFields && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>From</Label>
                <EmailAutocompleteInput
                  value={form.from}
                  onChange={(v) => setField("from", v)}
                  placeholder="Your email..."
                  multiple={false}
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
          )}
          {/* CC / BCC — always visible */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>CC</Label>
              <EmailAutocompleteInput
                value={form.cc}
                onChange={(v) => setField("cc", v)}
                placeholder="Search contacts..."
              />
            </div>
            <div>
              <Label>BCC</Label>
              <EmailAutocompleteInput
                value={form.bcc}
                onChange={(v) => setField("bcc", v)}
                placeholder="Search contacts..."
              />
            </div>
          </div>
          {/* Template Selector */}
          {templateType && (
            <TemplateSelector
              templateType={templateType}
              mergeData={templateMergeData || {}}
              onApply={handleTemplateApply}
              selectedId={selectedTemplateId}
              onSelectId={setSelectedTemplateId}
            />
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

          {/* Attachments */}
          {showAttachments && (
            <div>
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1.5">
                  <Paperclip className="w-3 h-3" />
                  Attachments
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={() => setShowFilePicker(true)}
                >
                  <Paperclip className="w-3 h-3" />
                  Add Files
                </Button>
              </div>
              {form.attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {form.attachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center gap-1.5 bg-gray-100 rounded-md px-2.5 py-1.5 text-xs group"
                    >
                      <FileText className="w-3 h-3 text-gray-500 flex-shrink-0" />
                      <button
                        type="button"
                        onClick={() => setPreviewAttachment(att)}
                        className="truncate max-w-[200px] hover:text-blue-600 hover:underline text-left"
                      >
                        {att.fileName}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeAttachment(att.id)}
                        className="text-gray-400 hover:text-red-500 flex-shrink-0"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <EmailPreview form={form} recipientDisplay={recipientDisplay} />
      )}

      {/* File Picker Dialog */}
      {showAttachments && (
        <>
          <FilePickerDialog
            open={showFilePicker}
            onClose={() => setShowFilePicker(false)}
            onSelect={(files) => {
              const attachments: EmailAttachment[] = files.map((f) => ({
                id: f.id,
                fileName: f.originalName || f.fileName,
                cloudinaryUrl: f.cloudinaryUrl,
                mimeType: f.mimeType,
              }));
              addAttachments(attachments);
              setShowFilePicker(false);
            }}
            multiple
            contextProjectId={contextProjectId}
            title="Attach Files"
          />
          <FilePreviewModal
            open={!!previewAttachment}
            onClose={() => setPreviewAttachment(null)}
            file={previewAttachment ? {
              originalName: previewAttachment.fileName,
              filePath: previewAttachment.cloudinaryUrl,
              mimeType: previewAttachment.mimeType || "application/octet-stream",
              fileName: previewAttachment.fileName,
            } : null}
          />
        </>
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
