import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { appendHtmlBlock } from "@/lib/emailFormat";
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
      const approvalBlock = `
<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
<p style="margin: 0 0 12px 0;">
  <a href="${approvalUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">View &amp; Approve Quote</a>
</p>
<p style="margin: 0; color: #6b7280; font-size: 12px;">Or copy this link: <a href="${approvalUrl}" style="color: #2563eb;">${approvalUrl}</a></p>`;
      const emailBody = appendHtmlBlock(formData.body, approvalBlock);

      const userAttachments = formData.attachments?.length
        ? formData.attachments.map((att) => ({ fileUrl: att.cloudinaryUrl, fileName: att.fileName }))
        : undefined;

      await apiRequest("POST", `/api/projects/${projectId}/communications`, {
        communicationType: "client_email",
        direction: "sent",
        fromEmail: formData.from || undefined,
        fromName: formData.fromName || undefined,
        recipientEmail: formData.to,
        recipientName: formData.toName || recipientName,
        subject: formData.subject,
        body: emailBody,
        cc: formData.cc || undefined,
        bcc: formData.bcc || undefined,
        metadata: { type: "quote", approvalUrl },
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
