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

interface SendPresentationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  recipientEmail: string;
  recipientName: string;
  companyName: string;
  orderNumber: string;
}

export default function SendPresentationDialog({
  open, onOpenChange, orderId, recipientEmail, recipientName, companyName, orderNumber,
}: SendPresentationDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [to, setTo] = useState(recipientEmail);
  const [subject, setSubject] = useState(`Product Presentation from ${companyName}`);
  const [body, setBody] = useState(
    `Hi ${recipientName.split(" ")[0] || "there"},\n\nPlease find our product presentation for your upcoming project. Click the link below to view and comment on the products.\n\nWe look forward to your feedback!\n\nBest regards,\n${companyName}`
  );

  const sendMutation = useMutation({
    mutationFn: async () => {
      // 1. Ensure share link exists
      const linkRes = await apiRequest("POST", `/api/orders/${orderId}/presentation/share-link`);
      const linkData = await linkRes.json();
      const presentationUrl = linkData.url;

      // 2. Send email via communications endpoint
      const emailBody = `${body}\n\n---\nView Presentation: ${presentationUrl}`;

      await apiRequest("POST", `/api/orders/${orderId}/communications`, {
        communicationType: "client_email",
        direction: "sent",
        recipientEmail: to,
        recipientName,
        subject,
        body: emailBody,
        metadata: { type: "presentation", presentationUrl },
      });

      // 3. Auto-set status to client_review
      await apiRequest("PATCH", `/api/orders/${orderId}`, {
        presentationStatus: "client_review",
      });
    },
    onSuccess: () => {
      toast({ title: "Presentation sent!", description: `Email sent to ${to}` });
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}`] });
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
            Send Presentation
          </DialogTitle>
          <DialogDescription>
            Send Presentation #{orderNumber} to your client via email.
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
            <p className="text-xs text-gray-400 mt-1">The presentation link will be automatically added to the email.</p>
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
