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

interface SendPresentationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  recipientEmail: string;
  recipientName: string;
  companyName: string;
  orderNumber: string;
  contacts?: EmailContact[];
}

export default function SendPresentationDialog({
  open, onOpenChange, projectId, recipientEmail, recipientName, companyName, orderNumber, contacts,
}: SendPresentationDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const sendMutation = useMutation({
    mutationFn: async (formData: EmailFormData & { adHocEmails: string[] }) => {
      const linkRes = await apiRequest("POST", `/api/projects/${projectId}/presentation/share-link`);
      const linkData = await linkRes.json();
      const presentationUrl = linkData.url;

      const emailBody = `${formData.body}\n\n---\nView Presentation: ${presentationUrl}`;

      await apiRequest("POST", `/api/projects/${projectId}/communications`, {
        communicationType: "client_email",
        direction: "sent",
        recipientEmail: formData.to,
        recipientName: formData.toName || recipientName,
        subject: formData.subject,
        body: emailBody,
        cc: formData.cc || undefined,
        bcc: formData.bcc || undefined,
        metadata: { type: "presentation", presentationUrl },
      });

      await apiRequest("PATCH", `/api/projects/${projectId}`, {
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

        <EmailComposer
          contacts={contacts}
          defaults={{
            to: recipientEmail,
            toName: recipientName,
            subject: `Product Presentation from ${companyName}`,
            body: `Hi ${recipientName.split(" ")[0] || "there"},\n\nPlease find our product presentation for your upcoming project. Click the link below to view and comment on the products.\n\nWe look forward to your feedback!\n\nBest regards,\n${companyName}`,
          }}
          showAdvancedFields
          richText
          footerHint="The presentation link will be automatically added to the email."
          onSend={(data) => sendMutation.mutate(data)}
          isSending={sendMutation.isPending}
          onCancel={() => onOpenChange(false)}
          resetTrigger={open}
        />
      </DialogContent>
    </Dialog>
  );
}
