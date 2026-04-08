import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { appendHtmlBlock } from "@/lib/emailFormat";
import type { EmailFormData } from "@/components/email/types";

interface UseSendSOParams {
  projectId: string;
  recipientName: string;
  soDocument: any;
  soTotal: number;
  quoteApprovals: any[];
  createQuoteApproval: (data: any) => Promise<any>;
  onOpenChange: (open: boolean) => void;
}

export function useSendSO({
  projectId,
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
        await apiRequest("PATCH", `/api/projects/${projectId}/quote-approvals/${existingApproval.id}`, {
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
      const approvalBlock = `
<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
<p style="margin: 0 0 12px 0;">
  <a href="${approvalUrl}" style="display: inline-block; background-color: #059669; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">View &amp; Approve Sales Order</a>
</p>
<p style="margin: 0; color: #6b7280; font-size: 12px;">Or copy this link: <a href="${approvalUrl}" style="color: #059669;">${approvalUrl}</a></p>`;
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
        metadata: { type: "sales_order", approvalUrl },
        autoAttachDocumentFile: soDocument?.fileUrl
          ? { fileUrl: soDocument.fileUrl, fileName: soDocument.fileName || `SalesOrder-${recipientName}.pdf` }
          : undefined,
        additionalAttachments: userAttachments,
      });

      await apiRequest("PATCH", `/api/projects/${projectId}`, {
        salesOrderStatus: "pending_client_approval",
      });
    },
    onSuccess: () => {
      toast({ title: "Sales Order sent!", description: "Email sent successfully." });
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
