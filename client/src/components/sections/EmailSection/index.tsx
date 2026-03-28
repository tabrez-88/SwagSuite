import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { format } from "date-fns";
import { Mail, Clock } from "lucide-react";
import EmailComposer from "@/components/email/EmailComposer";
import { useEmailSection, stripHtml } from "./hooks";
import type { EmailSectionProps } from "./types";

export default function EmailSection({ projectId, data }: EmailSectionProps) {
  const h = useEmailSection(projectId, data);

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
            ref={h.composerRef}
            contacts={h.clientContacts.length > 0 ? h.clientContacts : undefined}
            defaults={{
              to: h.primaryContact?.email || "",
              toName: h.primaryContact ? `${h.primaryContact.firstName} ${h.primaryContact.lastName}` : "",
            }}
            showAdvancedFields
            richText
            showPreview
            autoFillSender
            onSend={(data) => h.sendEmailMutation.mutate(data)}
            isSending={h.sendEmailMutation.isPending}
          />
        </CardContent>
      </Card>

      {/* Recent Communications */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Client Communications</CardTitle>
        </CardHeader>
        <CardContent>
          {h.clientCommunications.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No client communications yet</p>
          ) : (
            <div className="space-y-3">
              {h.clientCommunications.map((comm) => (
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
