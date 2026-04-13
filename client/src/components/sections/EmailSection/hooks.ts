import { useRef } from "react";
import { useSendClientEmail } from "@/services/communications/mutations";
import type { EmailComposerRef } from "@/components/email/EmailComposer";
import type { EmailContact, EmailFormData } from "@/components/email/types";
import type { ProjectData } from "@/types/project-types";

export function stripHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent || "";
}

export function useEmailSection(projectId: string, data: ProjectData) {
  const { order, primaryContact, clientCommunications, contacts } = data;
  const composerRef = useRef<EmailComposerRef>(null);

  const clientContacts: EmailContact[] = (contacts || []).map((c: any) => ({
    id: String(c.id),
    firstName: c.firstName || "",
    lastName: c.lastName || "",
    email: c.email,
    isPrimary: c.isPrimary,
    title: c.title,
    receiveOrderEmails: c.receiveOrderEmails,
  }));

  const _sendClientEmail = useSendClientEmail(Number(order?.id));

  const sendEmailMutation = {
    ..._sendClientEmail,
    mutate: (formData: EmailFormData & { adHocEmails: string[] }) => {
      const userAttachments = formData.attachments?.length
        ? formData.attachments.map((att) => ({ fileUrl: att.cloudinaryUrl, fileName: att.fileName }))
        : undefined;

      _sendClientEmail.mutate({
        communicationType: "client_email",
        direction: "sent",
        fromEmail: formData.from,
        fromName: formData.fromName,
        recipientEmail: formData.to,
        recipientName: formData.toName,
        subject: formData.subject,
        body: formData.body,
        cc: formData.cc || undefined,
        bcc: formData.bcc || undefined,
        additionalAttachments: userAttachments,
      }, {
        onSuccess: () => {
          composerRef.current?.reset({
            to: primaryContact?.email || "",
            toName: primaryContact ? `${primaryContact.firstName} ${primaryContact.lastName}` : "",
          });
        },
      });
    },
  };

  return {
    primaryContact,
    clientCommunications,
    clientContacts,
    composerRef,
    sendEmailMutation,
  };
}
