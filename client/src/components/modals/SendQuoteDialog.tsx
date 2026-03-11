import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface SendQuoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  recipientEmail: string;
  recipientName: string;
  companyName: string;
  orderNumber: string;
  quoteDocument: any;
  primaryContact: any;
  quoteTotal: number;
  quoteApprovals: any[];
  createQuoteApproval: (data: any) => Promise<any>;
}

export default function SendQuoteDialog({
  open, onOpenChange, orderId, recipientEmail, recipientName, companyName, orderNumber,
  quoteDocument, primaryContact, quoteTotal, quoteApprovals, createQuoteApproval,
}: SendQuoteDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [to, setTo] = useState(recipientEmail);
  const [subject, setSubject] = useState(`Quote #${orderNumber} from ${companyName}`);
  const [body, setBody] = useState(
    `Hi ${recipientName.split(" ")[0] || "there"},\n\nPlease find our quote for your upcoming project. Click the link below to review and approve the quote.\n\nWe look forward to working with you!\n\nBest regards,\n${companyName}`
  );

  const sendMutation = useMutation({
    mutationFn: async () => {
      // 1. Reuse existing pending approval or create new one
      const existingApproval = quoteApprovals.find((a: any) => a.status === "pending");
      let approvalToken: string;

      if (existingApproval) {
        approvalToken = existingApproval.approvalToken;
      } else {
        const result = await createQuoteApproval({
          clientEmail: to,
          clientName: recipientName,
          documentId: quoteDocument.id,
          pdfPath: quoteDocument.fileUrl,
          quoteTotal,
        });
        approvalToken = result.approvalToken;
      }
      const approvalUrl = `${window.location.origin}/client-approval/${approvalToken}`;

      // 2. Send email via communications endpoint
      const emailBody = `${body}\n\n---\nView & Approve Quote: ${approvalUrl}`;

      await apiRequest("POST", `/api/orders/${orderId}/communications`, {
        communicationType: "client_email",
        direction: "sent",
        recipientEmail: to,
        recipientName,
        subject,
        body: emailBody,
        metadata: { type: "quote", approvalUrl },
      });

      // 3. Auto-set status to sent
      await apiRequest("PATCH", `/api/orders/${orderId}`, {
        quoteStatus: "sent",
      });
    },
    onSuccess: () => {
      toast({ title: "Quote sent!", description: `Email sent to ${to}` });
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}/quote-approvals`] });
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: "Failed to send", description: "Please try again.", variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-5 h-5" />
            Send Quote
          </DialogTitle>
          <DialogDescription>
            Send Quote #{orderNumber} to your client for approval via email.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">To</label>
            <Input value={to} onChange={(e) => setTo(e.target.value)} placeholder="client@example.com" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Subject</label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Message</label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="min-h-[160px] resize-none text-sm"
            />
            <p className="text-xs text-gray-400 mt-1">The quote approval link will be automatically added to the email.</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={() => sendMutation.mutate()}
            disabled={sendMutation.isPending || !to.trim()}
            className="gap-1"
          >
            {sendMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Send Email
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
