import { useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { EmailComposerRef } from "@/components/email/EmailComposer";
import type { EmailContact, EmailFormData } from "@/components/email/types";
import type { ProjectData } from "@/types/project-types";

export function stripHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent || "";
}

export function useEmailSection(projectId: string, data: ProjectData) {
  const { order, primaryContact, clientCommunications, contacts } = data;
  const { toast } = useToast();
  const queryClient = useQueryClient();
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

  const sendEmailMutation = useMutation({
    mutationFn: async (formData: EmailFormData & { adHocEmails: string[] }) => {
      const userAttachments = formData.attachments?.length
        ? formData.attachments.map((att) => ({ fileUrl: att.cloudinaryUrl, fileName: att.fileName }))
        : undefined;

      const response = await fetch(`/api/projects/${order?.id}/communications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
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
        }),
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || "Failed to send email");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/projects/${projectId}/communications`, { type: "client_email" }],
      });
      toast({ title: "Email sent", description: "Client email has been sent successfully." });
      composerRef.current?.reset({
        to: primaryContact?.email || "",
        toName: primaryContact ? `${primaryContact.firstName} ${primaryContact.lastName}` : "",
      });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  return {
    primaryContact,
    clientCommunications,
    clientContacts,
    composerRef,
    sendEmailMutation,
  };
}
