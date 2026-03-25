import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import EmailComposer from "@/components/email/EmailComposer";
import type { EmailFormData } from "@/components/email/types";

export interface EmailContact {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  isPrimary?: boolean;
  title?: string | null;
}

interface SendEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contacts?: EmailContact[];
  recipientEmail?: string;
  recipientName?: string;
  companyName?: string;
  defaultSubject?: string;
}

export default function SendEmailDialog({
  open,
  onOpenChange,
  contacts = [],
  recipientEmail = "",
  recipientName = "",
  companyName = "",
  defaultSubject = "",
}: SendEmailDialogProps) {
  const { toast } = useToast();

  const sendEmailMutation = useMutation({
    mutationFn: async (data: EmailFormData & { adHocEmails: string[] }) => {
      const res = await apiRequest("POST", "/api/send-email", {
        fromEmail: data.from,
        fromName: data.fromName,
        recipientEmail: data.to,
        recipientName: data.toName,
        subject: data.subject,
        body: data.body,
        cc: data.cc || undefined,
        bcc: data.bcc || undefined,
        companyName: companyName || undefined,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Email sent", description: "Email has been sent successfully." });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to send email", description: error.message, variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Send Email</DialogTitle>
        </DialogHeader>

        <EmailComposer
          contacts={contacts.length > 0 ? contacts : undefined}
          defaults={{
            to: recipientEmail,
            toName: recipientName,
            subject: defaultSubject,
          }}
          showAdvancedFields
          richText
          showPreview
          autoFillSender
          onSend={(data) => sendEmailMutation.mutate(data)}
          isSending={sendEmailMutation.isPending}
          onCancel={() => onOpenChange(false)}
          resetTrigger={open}
        />
      </DialogContent>
    </Dialog>
  );
}
