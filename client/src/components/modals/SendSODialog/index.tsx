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
import { useSendSO } from "./hooks";

interface SendSODialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  recipientEmail: string;
  recipientName: string;
  companyName: string;
  orderNumber: string;
  soDocument: any;
  soTotal: number;
  quoteApprovals: any[];
  createQuoteApproval: (data: any) => Promise<any>;
  contacts?: EmailContact[];
}

export default function SendSODialog({
  open, onOpenChange, projectId, recipientEmail, recipientName, companyName, orderNumber,
  soDocument, soTotal, quoteApprovals, createQuoteApproval, contacts,
}: SendSODialogProps) {
  const { sendMutation } = useSendSO({
    projectId, recipientName, soDocument, soTotal, quoteApprovals, createQuoteApproval, onOpenChange,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-5 h-5" />
            Send Sales Order
          </DialogTitle>
          <DialogDescription>
            Send Sales Order #{orderNumber} to your client for approval via email.
          </DialogDescription>
        </DialogHeader>

        <EmailComposer
          contacts={contacts}
          defaults={{
            to: recipientEmail,
            toName: recipientName,
            subject: `Sales Order #${orderNumber} from ${companyName}`,
            body: `Hi ${recipientName.split(" ")[0] || "there"},\n\nPlease find the sales order for your project. Click the link below to review and approve.\n\nIf you have any questions or need changes, please don't hesitate to reach out.\n\nBest regards,\n${companyName}`,
          }}
          showAdvancedFields
          footerHint="The approval link will be automatically added to the email."
          onSend={(data) => sendMutation.mutate(data)}
          isSending={sendMutation.isPending}
          onCancel={() => onOpenChange(false)}
          resetTrigger={open}
        />
      </DialogContent>
    </Dialog>
  );
}
