import { useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Send, Loader2 } from "lucide-react";
import { createShareLink, updateProject } from "@/services/projects/requests";
import { sendCommunication } from "@/services/communications/requests";
import { useToast } from "@/hooks/use-toast";
import EmailComposer from "@/components/email/EmailComposer";
import type { EmailContact, EmailFormData } from "@/components/email/types";
import { useAuth } from "@/hooks/useAuth";
import { useDefaultEmailTemplate, applyTemplate } from "@/hooks/useEmailTemplates";

interface SendPresentationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  recipientEmail: string;
  recipientName: string;
  companyName: string;
  orderNumber: string;
  contacts?: EmailContact[];
  assignedUserEmail?: string;
}

export default function SendPresentationDialog({
  open, onOpenChange, projectId, recipientEmail, recipientName, companyName, orderNumber, contacts,
  assignedUserEmail,
}: SendPresentationDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const currentEmail = (user as any)?.email || "";
  const defaultCc = assignedUserEmail && assignedUserEmail !== currentEmail ? assignedUserEmail : "";

  const mergeData = useMemo(() => ({
    companyName,
    senderName: "",
    recipientName,
    recipientFirstName: recipientName.split(" ")[0] || "there",
    orderNumber,
  }), [companyName, recipientName, orderNumber]);

  const { data: defaultTemplate, isLoading: loadingTemplate } = useDefaultEmailTemplate("presentation");

  const applied = useMemo(() => {
    if (defaultTemplate) return applyTemplate(defaultTemplate, mergeData);
    return {
      subject: `Product Presentation from ${companyName}`,
      body: `Hi ${recipientName.split(" ")[0] || "there"},\n\nPlease find our product presentation for your upcoming project. Click the link below to view and comment on the products.\n\nWe look forward to your feedback!\n\nBest regards,\n${companyName}`,
    };
  }, [defaultTemplate, mergeData, companyName, recipientName]);

  const sendMutation = useMutation({
    mutationFn: async (formData: EmailFormData & { adHocEmails: string[] }) => {
      // Create share link
      const linkData = await createShareLink(projectId);
      const shareToken = linkData.token || linkData.url?.split("/").pop();

      const userAttachments = formData.attachments?.length
        ? formData.attachments.map((att) => ({ fileUrl: att.cloudinaryUrl, fileName: att.fileName }))
        : undefined;

      // Send bodyHtml — server pipeline resolves merge tags + auto-appends presentation link
      await sendCommunication(projectId, {
        communicationType: "client_email",
        direction: "sent",
        recipientEmail: formData.to,
        recipientName: formData.toName || recipientName,
        subject: formData.subject,
        body: formData.bodyHtml || formData.body,
        cc: formData.cc || undefined,
        bcc: formData.bcc || undefined,
        metadata: {
          type: "presentation",
          presentationUrl: linkData.url,
        },
        mergeContext: {
          type: "presentation",
          orderId: projectId,
          shareToken,
        },
        additionalAttachments: userAttachments,
      });

      await updateProject(projectId, {
        presentationStatus: "client_review",
      });
    },
    onSuccess: () => {
      toast({ title: "Presentation sent!", description: "Email sent successfully." });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}`] });
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: "Failed to send", description: "Please try again.", variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-5 h-5" />
            Send Presentation
          </DialogTitle>
          <DialogDescription>
            Send Presentation #{orderNumber} to your client via email.
          </DialogDescription>
        </DialogHeader>

        {loadingTemplate ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : (
          <EmailComposer
            contacts={contacts}
            defaults={{
              to: recipientEmail,
              toName: recipientName,
              cc: defaultCc,
              subject: applied.subject,
              body: applied.body,
            }}
            templateType="presentation"
            templateMergeData={mergeData}
            showAdvancedFields
            showAttachments
            contextProjectId={projectId}
            footerHint="The presentation link will be automatically added to the email."
            onSend={(data) => sendMutation.mutate(data)}
            isSending={sendMutation.isPending}
            onCancel={() => onOpenChange(false)}
            resetTrigger={open}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
