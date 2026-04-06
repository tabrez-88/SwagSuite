import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { EmailFormData } from "@/components/email/types";

interface UseSendInvoiceParams {
  projectId: string;
  recipientName: string;
  invoiceNumber: string;
  invoiceDocument: any;
  onOpenChange: (open: boolean) => void;
}

export function useSendInvoice({
  projectId,
  recipientName,
  invoiceNumber,
  invoiceDocument,
  onOpenChange,
}: UseSendInvoiceParams) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderFrequency, setReminderFrequency] = useState(7);

  const sendMutation = useMutation({
    mutationFn: async (formData: EmailFormData & { adHocEmails: string[] }) => {
      await apiRequest("POST", `/api/projects/${projectId}/communications`, {
        communicationType: "client_email",
        direction: "sent",
        fromEmail: formData.from || undefined,
        fromName: formData.fromName || undefined,
        recipientEmail: formData.to,
        recipientName: formData.toName || recipientName,
        subject: formData.subject,
        body: formData.body,
        cc: formData.cc || undefined,
        bcc: formData.bcc || undefined,
        metadata: {
          type: "invoice",
          invoiceNumber,
          documentId: invoiceDocument.id,
          pdfPath: invoiceDocument.fileUrl,
        },
        autoAttachDocumentFile: {
          fileUrl: invoiceDocument.fileUrl,
          fileName: `Invoice-${invoiceNumber}.pdf`,
        },
      });

      await apiRequest("PATCH", `/api/projects/${projectId}/invoice`, {
        status: "sent",
        sentAt: new Date().toISOString(),
        ...(reminderEnabled ? {
          reminderEnabled: true,
          reminderFrequencyDays: reminderFrequency,
          nextReminderDate: new Date(Date.now() + reminderFrequency * 24 * 60 * 60 * 1000).toISOString(),
        } : {}),
      });
    },
    onSuccess: () => {
      toast({ title: "Invoice sent!", description: "Email sent successfully." });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/invoice`] });
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: "Failed to send", description: "Please try again.", variant: "destructive" });
    },
  });

  return {
    reminderEnabled,
    setReminderEnabled,
    reminderFrequency,
    setReminderFrequency,
    sendMutation,
  };
}
