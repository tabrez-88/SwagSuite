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

      const userAttachments = formData.attachments?.length
        ? formData.attachments.map((att) => ({ fileUrl: att.cloudinaryUrl, fileName: att.fileName }))
        : undefined;

      // Send bodyHtml (with merge-tag pills) — server pipeline resolves tags + auto-appends approval link
      await apiRequest("POST", `/api/projects/${projectId}/communications`, {
        communicationType: "client_email",
        direction: "sent",
        fromEmail: formData.from || undefined,
        fromName: formData.fromName || undefined,
        recipientEmail: formData.to,
        recipientName: formData.toName || recipientName,
        subject: formData.subject,
        body: formData.bodyHtml || formData.body,
        cc: formData.cc || undefined,
        bcc: formData.bcc || undefined,
        metadata: {
          type: "quote",
          approvalToken,
        },
        mergeContext: {
          type: "quote",
          orderId: projectId,
          approvalToken,
        },
        autoAttachDocumentFile: quoteDocument?.fileUrl
          ? { fileUrl: quoteDocument.fileUrl, fileName: quoteDocument.fileName || `Quote-${recipientName}.pdf` }
          : undefined,
        additionalAttachments: userAttachments,
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
