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

interface SendSODialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
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
  open, onOpenChange, orderId, recipientEmail, recipientName, companyName, orderNumber,
  soDocument, soTotal, quoteApprovals, createQuoteApproval, contacts,
}: SendSODialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const sendMutation = useMutation({
    mutationFn: async (formData: EmailFormData & { adHocEmails: string[] }) => {
      const existingApproval = quoteApprovals.find((a: any) => a.status === "pending");
      let approvalToken: string;

      if (existingApproval) {
        approvalToken = existingApproval.approvalToken;
        await apiRequest("PATCH", `/api/orders/${orderId}/quote-approvals/${existingApproval.id}`, {
          documentId: soDocument.id,
          pdfPath: soDocument.fileUrl,
          quoteTotal: soTotal,
        });
      } else {
        const result = await createQuoteApproval({
          clientEmail: formData.to,
          clientName: formData.toName || recipientName,
          documentId: soDocument.id,
          pdfPath: soDocument.fileUrl,
          quoteTotal: soTotal,
        });
        approvalToken = result.approvalToken;
      }
      const approvalUrl = `${window.location.origin}/client-approval/${approvalToken}`;
      const emailBody = `${formData.body}\n\n---\nView & Approve Sales Order: ${approvalUrl}`;

      await apiRequest("POST", `/api/orders/${orderId}/communications`, {
        communicationType: "client_email",
        direction: "sent",
        recipientEmail: formData.to,
        recipientName: formData.toName || recipientName,
        subject: formData.subject,
        body: emailBody,
        cc: formData.cc || undefined,
        bcc: formData.bcc || undefined,
        metadata: { type: "sales_order", approvalUrl },
      });

      await apiRequest("PATCH", `/api/orders/${orderId}`, {
        salesOrderStatus: "pending_client_approval",
      });
    },
    onSuccess: () => {
      toast({ title: "Sales Order sent!", description: "Email sent successfully." });
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
