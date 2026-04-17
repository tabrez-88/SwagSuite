import { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Send, Loader2 } from "lucide-react";
import EmailComposer from "@/components/email/EmailComposer";
import type { EmailContact } from "@/components/email/types";
import { useAuth } from "@/hooks/useAuth";
import { useDefaultEmailTemplate, applyTemplate } from "@/hooks/useEmailTemplates";
import { useSendQuote } from "./hooks";

interface SendQuoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  recipientEmail: string;
  recipientName: string;
  companyName: string;
  orderNumber: string;
  quoteDocument: any;
  primaryContact: any;
  quoteTotal: number;
  quoteApprovals: any[];
  createQuoteApproval: (data: any) => Promise<any>;
  contacts?: EmailContact[];
  assignedUserEmail?: string;
}

export default function SendQuoteDialog({
  open, onOpenChange, projectId, recipientEmail, recipientName, companyName, orderNumber,
  quoteDocument, primaryContact, quoteTotal, quoteApprovals, createQuoteApproval, contacts,
  assignedUserEmail,
}: SendQuoteDialogProps) {
  const { user } = useAuth();
  const currentEmail = (user as any)?.email || "";
  const senderName = user ? `${(user as any).firstName || ""} ${(user as any).lastName || ""}`.trim() : "";
  const defaultCc = assignedUserEmail && assignedUserEmail !== currentEmail ? assignedUserEmail : "";
  const { sendMutation } = useSendQuote({
    projectId, recipientName, quoteDocument, quoteTotal, quoteApprovals, createQuoteApproval, onOpenChange,
  });

  const existingApproval = quoteApprovals?.find((a: any) => a.status === "pending");
  const approvalUrl = existingApproval
    ? `${window.location.origin}/client-approval/${existingApproval.approvalToken}`
    : "";

  const mergeData = useMemo(() => ({
    companyName,
    senderName,
    recipientName,
    recipientFirstName: recipientName.split(" ")[0] || "there",
    orderNumber,
    approvalLink: approvalUrl,
  }), [companyName, senderName, recipientName, orderNumber, approvalUrl]);

  const { data: defaultTemplate, isLoading: loadingTemplate } = useDefaultEmailTemplate("quote");

  const applied = useMemo(() => {
    if (defaultTemplate) return applyTemplate(defaultTemplate, mergeData);
    return {
      subject: `Quote #${orderNumber} from ${companyName}`,
      body: `<p>Hi ${recipientName.split(" ")[0] || "there"},</p><p>Please find our quote for your upcoming project. You can review and approve it using the link below:</p><p><span data-merge-tag="approvalLink">{{approvalLink}}</span></p><p>We look forward to working with you!</p><p>Best regards,<br>${companyName}</p>`,
    };
  }, [defaultTemplate, mergeData, orderNumber, companyName, recipientName]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-5 h-5" />
            Send Quote
          </DialogTitle>
          <DialogDescription>
            Send Quote #{orderNumber} to your client for approval via email.
          </DialogDescription>
        </DialogHeader>

        {loadingTemplate ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : (
          <EmailComposer
            contacts={contacts}
            defaults={{
              to: recipientEmail,
              toName: recipientName,
              cc: defaultCc,
              subject: applied.subject,
              body: applied.body,
            }}
            templateType="quote"
            templateMergeData={mergeData}
            showAdvancedFields
            showAttachments
            contextProjectId={projectId}
            footerHint="The quote PDF will be attached to the email."
            onSend={(data) => sendMutation.mutate(data)}
            isSending={sendMutation.isPending}
            onCancel={() => onOpenChange(false)}
            resetTrigger={open}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
