import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Send } from "lucide-react";
import EmailComposer from "@/components/email/EmailComposer";
import type { EmailContact } from "@/components/email/types";
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
}

export default function SendQuoteDialog({
  open, onOpenChange, projectId, recipientEmail, recipientName, companyName, orderNumber,
  quoteDocument, primaryContact, quoteTotal, quoteApprovals, createQuoteApproval, contacts,
}: SendQuoteDialogProps) {
  const { sendMutation } = useSendQuote({
    projectId, recipientName, quoteDocument, quoteTotal, quoteApprovals, createQuoteApproval, onOpenChange,
  });

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

        <EmailComposer
          contacts={contacts}
          defaults={{
            to: recipientEmail,
            toName: recipientName,
            subject: `Quote #${orderNumber} from ${companyName}`,
            body: `Hi ${recipientName.split(" ")[0] || "there"},\n\nPlease find our quote for your upcoming project. Click the link below to review and approve the quote.\n\nWe look forward to working with you!\n\nBest regards,\n${companyName}`,
          }}
          showAdvancedFields
          richText
          footerHint="The quote approval link will be automatically added to the email."
          onSend={(data) => sendMutation.mutate(data)}
          isSending={sendMutation.isPending}
          onCancel={() => onOpenChange(false)}
          resetTrigger={open}
        />
      </DialogContent>
    </Dialog>
  );
}
