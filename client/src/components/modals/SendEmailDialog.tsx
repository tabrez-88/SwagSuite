import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSendGenericEmail } from "@/services/communications/mutations";
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
  const sendEmailMutation = useSendGenericEmail();

  const handleSend = (data: EmailFormData & { adHocEmails: string[] }) => {
    const userAttachments = data.attachments?.length
      ? data.attachments.map((att) => ({ fileUrl: att.cloudinaryUrl, fileName: att.fileName }))
      : undefined;

    sendEmailMutation.mutate({
      fromEmail: data.from,
      fromName: data.fromName,
      recipientEmail: data.to,
      recipientName: data.toName,
      subject: data.subject,
      body: data.body,
      cc: data.cc || undefined,
      bcc: data.bcc || undefined,
      companyName: companyName || undefined,
      additionalAttachments: userAttachments,
    }, { onSuccess: () => onOpenChange(false) });
  };

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
          showPreview
          showAttachments
          autoFillSender
          onSend={handleSend}
          isSending={sendEmailMutation.isPending}
          onCancel={() => onOpenChange(false)}
          resetTrigger={open}
        />
      </DialogContent>
    </Dialog>
  );
}
