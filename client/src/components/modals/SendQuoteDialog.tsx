import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Send } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import EmailComposer from "@/components/email/EmailComposer";
import type { EmailContact, EmailFormData } from "@/components/email/types";

interface SendQuoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
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
  open, onOpenChange, orderId, recipientEmail, recipientName, companyName, orderNumber,
  quoteDocument, primaryContact, quoteTotal, quoteApprovals, createQuoteApproval, contacts,
}: SendQuoteDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const sendMutation = useMutation({
    mutationFn: async (formData: EmailFormData & { adHocEmails: string[] }) => {
      const existingApproval = quoteApprovals.find((a: any) => a.status === "pending");
      let approvalToken: string;

      if (existingApproval) {
        approvalToken = existingApproval.approvalToken;
      } else {
        const result = await createQuoteApproval({
          clientEmail: formData.to,
          clientName: formData.toName || recipientName,
          documentId: quoteDocument.id,
          pdfPath: quoteDocument.fileUrl,
          quoteTotal,
        });
        approvalToken = result.approvalToken;
      }
      const approvalUrl = `${window.location.origin}/client-approval/${approvalToken}`;
      const emailBody = `${formData.body}\n\n---\nView & Approve Quote: ${approvalUrl}`;

      await apiRequest("POST", `/api/orders/${orderId}/communications`, {
        communicationType: "client_email",
        direction: "sent",
        recipientEmail: formData.to,
        recipientName: formData.toName || recipientName,
        subject: formData.subject,
        body: emailBody,
        cc: formData.cc || undefined,
        bcc: formData.bcc || undefined,
        metadata: { type: "quote", approvalUrl },
      });

      await apiRequest("PATCH", `/api/orders/${orderId}`, {
        quoteStatus: "sent",
      });
    },
    onSuccess: () => {
      toast({ title: "Quote sent!", description: "Email sent successfully." });
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}/quote-approvals`] });
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: "Failed to send", description: "Please try again.", variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
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
