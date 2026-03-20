import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { EmailFormData } from "@/components/email/types";

interface UseSendSOParams {
  orderId: string;
  recipientName: string;
  soDocument: any;
  soTotal: number;
  quoteApprovals: any[];
  createQuoteApproval: (data: any) => Promise<any>;
  onOpenChange: (open: boolean) => void;
}

export function useSendSO({
  orderId,
  recipientName,
  soDocument,
  soTotal,
  quoteApprovals,
  createQuoteApproval,
  onOpenChange,
}: UseSendSOParams) {
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

  return { sendMutation };
}
