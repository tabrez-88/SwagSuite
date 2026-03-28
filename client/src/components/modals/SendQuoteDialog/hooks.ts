import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { EmailFormData } from "@/components/email/types";

interface UseSendQuoteParams {
  projectId: string;
  recipientName: string;
  quoteDocument: any;
  quoteTotal: number;
  quoteApprovals: any[];
  createQuoteApproval: (data: any) => Promise<any>;
  onOpenChange: (open: boolean) => void;
}

export function useSendQuote({
  projectId,
  recipientName,
  quoteDocument,
  quoteTotal,
  quoteApprovals,
  createQuoteApproval,
  onOpenChange,
}: UseSendQuoteParams) {
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

      await apiRequest("POST", `/api/projects/${projectId}/communications`, {
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

      await apiRequest("PATCH", `/api/projects/${projectId}`, {
        quoteStatus: "sent",
      });
    },
    onSuccess: () => {
      toast({ title: "Quote sent!", description: "Email sent successfully." });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/quote-approvals`] });
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: "Failed to send", description: "Please try again.", variant: "destructive" });
    },
  });

  return { sendMutation };
}
