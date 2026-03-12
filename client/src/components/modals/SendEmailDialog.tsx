import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { RichTextEditor } from "@/components/RichTextEditor";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Send, Eye, Edit, Loader2, ChevronDown, ChevronUp, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
  const { user: currentUser } = useAuth();
  const { toast } = useToast();

  // Selected contact IDs (for contacts mode)
  const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(new Set());

  // Manual To field (when no contacts provided)
  const [emailTo, setEmailTo] = useState(recipientEmail);
  const [emailToName, setEmailToName] = useState(recipientName);

  const [emailFrom, setEmailFrom] = useState("");
  const [emailFromName, setEmailFromName] = useState("");
  const [emailSubject, setEmailSubject] = useState(defaultSubject);
  const [emailBody, setEmailBody] = useState("");
  const [emailCc, setEmailCc] = useState("");
  const [emailBcc, setEmailBcc] = useState("");
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [previewMode, setPreviewMode] = useState<"compose" | "preview">("compose");

  const hasContacts = contacts.length > 0;
  const contactsWithEmail = contacts.filter((c) => c.email);

  // Reset when opened
  useEffect(() => {
    if (open) {
      // Auto-select primary contact if available
      const primary = contactsWithEmail.find((c) => c.isPrimary);
      setSelectedContactIds(primary ? new Set([primary.id]) : new Set());
      setEmailTo(recipientEmail);
      setEmailToName(recipientName);
      setEmailSubject(defaultSubject);
      setEmailBody("");
      setEmailCc("");
      setEmailBcc("");
      setShowCcBcc(false);
      setPreviewMode("compose");
    }
  }, [open]);

  // Auto-fill sender from current user
  useEffect(() => {
    if (currentUser && !emailFrom) {
      setEmailFrom((currentUser as any).email || "");
      setEmailFromName(
        `${(currentUser as any).firstName || ""} ${(currentUser as any).lastName || ""}`.trim(),
      );
    }
  }, [currentUser, emailFrom]);

  const toggleContact = (id: string) => {
    setSelectedContactIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedContacts = contactsWithEmail.filter((c) => selectedContactIds.has(c.id));

  // Build recipient string from selected contacts
  const getRecipientEmails = () => {
    if (hasContacts) {
      return selectedContacts.map((c) => c.email!).join(", ");
    }
    return emailTo;
  };

  const getRecipientNames = () => {
    if (hasContacts) {
      return selectedContacts.map((c) => `${c.firstName} ${c.lastName}`).join(", ");
    }
    return emailToName;
  };

  const sendEmailMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/send-email", data);
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

  const handleSend = () => {
    const to = getRecipientEmails();
    if (!to || !emailSubject || !emailBody) {
      toast({ title: "Missing fields", description: "Please select recipients and fill in Subject and Body.", variant: "destructive" });
      return;
    }
    sendEmailMutation.mutate({
      fromEmail: emailFrom,
      fromName: emailFromName,
      recipientEmail: to,
      recipientName: getRecipientNames(),
      subject: emailSubject,
      body: emailBody,
      cc: emailCc || undefined,
      bcc: emailBcc || undefined,
      companyName: companyName || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Send Email</DialogTitle>
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
        </DialogHeader>

        {previewMode === "compose" ? (
          <div className="space-y-4">
            {/* Recipient: contacts list or manual input */}
            {hasContacts ? (
              <div>
                <Label>To *</Label>
                <div className="mt-1 border rounded-lg divide-y max-h-40 overflow-y-auto">
                  {contactsWithEmail.length === 0 ? (
                    <p className="text-sm text-muted-foreground p-3">No contacts with email address</p>
                  ) : (
                    contactsWithEmail.map((contact) => (
                      <label
                        key={contact.id}
                        className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                      >
                        <Checkbox
                          checked={selectedContactIds.has(contact.id)}
                          onCheckedChange={() => toggleContact(contact.id)}
                        />
                        <User className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium">
                            {contact.firstName} {contact.lastName}
                          </span>
                          {contact.title && (
                            <span className="text-xs text-muted-foreground ml-1.5">· {contact.title}</span>
                          )}
                          <p className="text-xs text-muted-foreground truncate">{contact.email}</p>
                        </div>
                        {contact.isPrimary && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Primary</Badge>
                        )}
                      </label>
                    ))
                  )}
                </div>
                {contacts.filter((c) => !c.email).length > 0 && (
                  <p className="text-xs text-amber-600 mt-1">
                    {contacts.filter((c) => !c.email).length} contact(s) hidden — no email address
                  </p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>To *</Label>
                  <Input value={emailTo} onChange={(e) => setEmailTo(e.target.value)} placeholder="recipient@example.com" />
                </div>
                <div>
                  <Label>To Name</Label>
                  <Input value={emailToName} onChange={(e) => setEmailToName(e.target.value)} placeholder="Recipient name" />
                </div>
              </div>
            )}

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

            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground p-0 h-auto"
              onClick={() => setShowCcBcc(!showCcBcc)}
            >
              {showCcBcc ? <ChevronUp className="w-3 h-3 mr-1" /> : <ChevronDown className="w-3 h-3 mr-1" />}
              CC / BCC
            </Button>

            {showCcBcc && (
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
            )}

            <div>
              <Label>Subject *</Label>
              <Input value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} placeholder="Email subject" />
            </div>
            <div>
              <Label>Body *</Label>
              <RichTextEditor value={emailBody} onChange={setEmailBody} placeholder="Compose your email..." />
            </div>
          </div>
        ) : (
          <div className="border rounded-lg p-4 bg-white">
            <div className="text-sm space-y-1 mb-4">
              <p><strong>To:</strong> {getRecipientNames()} &lt;{getRecipientEmails()}&gt;</p>
              <p><strong>From:</strong> {emailFromName} &lt;{emailFrom}&gt;</p>
              {emailCc && <p><strong>CC:</strong> {emailCc}</p>}
              {emailBcc && <p><strong>BCC:</strong> {emailBcc}</p>}
              <p><strong>Subject:</strong> {emailSubject}</p>
            </div>
            <Separator />
            <div className="mt-4 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: emailBody }} />
          </div>
        )}

        <div className="flex justify-end pt-2">
          <Button onClick={handleSend} disabled={sendEmailMutation.isPending}>
            {sendEmailMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
            {sendEmailMutation.isPending ? "Sending..." : "Send Email"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
