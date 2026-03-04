import { useState, useEffect, useRef, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { UserAvatar } from "@/components/UserAvatar";
import { RichTextEditor } from "@/components/RichTextEditor";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Mail, Send, Clock, Eye, Edit } from "lucide-react";
import type { useOrderDetailData } from "../hooks/useOrderDetailData";

function stripHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent || "";
}

interface EmailSectionProps {
  orderId: string;
  data: ReturnType<typeof useOrderDetailData>;
}

export default function EmailSection({ orderId, data }: EmailSectionProps) {
  const { order, primaryContact, clientCommunications, contacts } = data;
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [emailTo, setEmailTo] = useState("");
  const [emailToName, setEmailToName] = useState("");
  const [emailFrom, setEmailFrom] = useState("");
  const [emailFromName, setEmailFromName] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [emailCc, setEmailCc] = useState("");
  const [emailBcc, setEmailBcc] = useState("");
  const [previewMode, setPreviewMode] = useState<"compose" | "preview">("compose");

  // Auto-fill from/to
  useEffect(() => {
    if (currentUser && !emailFrom) {
      setEmailFrom((currentUser as any).email || "");
      setEmailFromName(
        `${(currentUser as any).firstName || ""} ${(currentUser as any).lastName || ""}`.trim(),
      );
    }
  }, [currentUser, emailFrom]);

  useEffect(() => {
    if (primaryContact && !emailTo) {
      setEmailTo(primaryContact.email || "");
      setEmailToName(`${primaryContact.firstName} ${primaryContact.lastName}`);
    }
  }, [primaryContact, emailTo]);

  const sendEmailMutation = useMutation({
    mutationFn: async (emailData: any) => {
      const response = await fetch(`/api/orders/${order?.id}/communications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          communicationType: "client_email",
          direction: "sent",
          fromEmail: emailData.fromEmail,
          fromName: emailData.fromName,
          recipientEmail: emailData.recipientEmail,
          recipientName: emailData.recipientName,
          subject: emailData.subject,
          body: emailData.body,
          cc: emailData.cc,
          bcc: emailData.bcc,
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
      setEmailSubject("");
      setEmailBody("");
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleSend = () => {
    if (!emailTo || !emailSubject || !emailBody) {
      toast({ title: "Missing fields", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }
    sendEmailMutation.mutate({
      fromEmail: emailFrom,
      fromName: emailFromName,
      recipientEmail: emailTo,
      recipientName: emailToName,
      subject: emailSubject,
      body: emailBody,
      cc: emailCc,
      bcc: emailBcc,
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold flex items-center gap-2">
        <Mail className="w-5 h-5" />
        Client Communication
      </h2>

      {/* Compose Email */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Compose Email</CardTitle>
            <div className="flex gap-1">
              <Button
                variant={previewMode === "compose" ? "default" : "ghost"}
                size="sm"
                onClick={() => setPreviewMode("compose")}
              >
                <Edit className="w-3 h-3 mr-1" />
                Compose
              </Button>
              <Button
                variant={previewMode === "preview" ? "default" : "ghost"}
                size="sm"
                onClick={() => setPreviewMode("preview")}
              >
                <Eye className="w-3 h-3 mr-1" />
                Preview
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {previewMode === "compose" ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>To</Label>
                  <Input value={emailTo} onChange={(e) => setEmailTo(e.target.value)} placeholder="recipient@example.com" />
                </div>
                <div>
                  <Label>To Name</Label>
                  <Input value={emailToName} onChange={(e) => setEmailToName(e.target.value)} placeholder="Recipient name" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>From</Label>
                  <Input value={emailFrom} onChange={(e) => setEmailFrom(e.target.value)} />
                </div>
                <div>
                  <Label>From Name</Label>
                  <Input value={emailFromName} onChange={(e) => setEmailFromName(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>CC</Label>
                  <Input value={emailCc} onChange={(e) => setEmailCc(e.target.value)} placeholder="Optional" />
                </div>
                <div>
                  <Label>BCC</Label>
                  <Input value={emailBcc} onChange={(e) => setEmailBcc(e.target.value)} placeholder="Optional" />
                </div>
              </div>
              <div>
                <Label>Subject</Label>
                <Input value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} placeholder="Email subject" />
              </div>
              <div>
                <Label>Body</Label>
                <RichTextEditor value={emailBody} onChange={setEmailBody} />
              </div>
            </>
          ) : (
            <div className="border rounded-lg p-4 bg-white">
              <div className="text-sm space-y-2 mb-4">
                <p><strong>To:</strong> {emailToName} &lt;{emailTo}&gt;</p>
                <p><strong>From:</strong> {emailFromName} &lt;{emailFrom}&gt;</p>
                <p><strong>Subject:</strong> {emailSubject}</p>
              </div>
              <Separator />
              <div className="mt-4 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: emailBody }} />
            </div>
          )}

          <div className="flex justify-end">
            <Button onClick={handleSend} disabled={sendEmailMutation.isPending}>
              <Send className="w-4 h-4 mr-2" />
              {sendEmailMutation.isPending ? "Sending..." : "Send Email"}
            </Button>
          </div>
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
