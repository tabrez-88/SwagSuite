import { useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserAvatar } from "@/components/UserAvatar";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Mail, Clock } from "lucide-react";
import type { ProjectData } from "@/types/project-types";
import EmailComposer, { type EmailComposerRef } from "@/components/email/EmailComposer";
import type { EmailContact, EmailFormData } from "@/components/email/types";

function stripHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent || "";
}

interface EmailSectionProps {
  orderId: string;
  data: ProjectData;
}

export default function EmailSection({ orderId, data }: EmailSectionProps) {
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
      const response = await fetch(`/api/orders/${order?.id}/communications`, {
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
        queryKey: [`/api/orders/${orderId}/communications`, { type: "client_email" }],
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

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold flex items-center gap-2">
        <Mail className="w-5 h-5" />
        Client Communication
      </h2>

      {/* Compose Email */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Compose Email</CardTitle>
        </CardHeader>
        <CardContent>
          <EmailComposer
            ref={composerRef}
            contacts={clientContacts.length > 0 ? clientContacts : undefined}
            defaults={{
              to: primaryContact?.email || "",
              toName: primaryContact ? `${primaryContact.firstName} ${primaryContact.lastName}` : "",
            }}
            showAdvancedFields
            richText
            showPreview
            autoFillSender
            onSend={(data) => sendEmailMutation.mutate(data)}
            isSending={sendEmailMutation.isPending}
          />
        </CardContent>
      </Card>

      {/* Recent Communications */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Client Communications</CardTitle>
        </CardHeader>
        <CardContent>
          {clientCommunications.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No client communications yet</p>
          ) : (
            <div className="space-y-3">
              {clientCommunications.map((comm) => (
                <div key={comm.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <UserAvatar name={`${comm.user.firstName} ${comm.user.lastName}`} size="sm" />
                      <span className="text-sm font-medium">{comm.user.firstName} {comm.user.lastName}</span>
                    </div>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {format(new Date(comm.createdAt), "MMM dd, h:mm a")}
                    </span>
                  </div>
                  <p className="text-sm font-medium">{comm.subject}</p>
                  <p className="text-xs text-gray-500">To: {comm.recipientName || comm.recipientEmail}</p>
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">{stripHtml(comm.body)}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
