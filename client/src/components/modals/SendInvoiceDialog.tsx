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

interface SendInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  recipientEmail: string;
  recipientName: string;
  companyName: string;
  orderNumber: string;
  invoiceNumber: string;
  invoiceDocument: any;
  totalAmount: number;
  dueDate?: string;
}

export default function SendInvoiceDialog({
  open, onOpenChange, orderId, recipientEmail, recipientName, companyName, orderNumber,
  invoiceNumber, invoiceDocument, totalAmount, dueDate,
}: SendInvoiceDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const dueDateFormatted = dueDate
    ? new Date(dueDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : null;

  const [to, setTo] = useState(recipientEmail);
  const [subject, setSubject] = useState(`Invoice #${invoiceNumber} from ${companyName}`);
  const [body, setBody] = useState(
    `Hi ${recipientName.split(" ")[0] || "there"},\n\nPlease find attached Invoice #${invoiceNumber} for $${totalAmount.toFixed(2)}${dueDateFormatted ? ` due by ${dueDateFormatted}` : ""}.\n\nIf you have any questions regarding this invoice, please don't hesitate to reach out.\n\nThank you for your business!\n\nBest regards,\n${companyName}`
  );

  const sendMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/orders/${orderId}/communications`, {
        communicationType: "client_email",
        direction: "sent",
        recipientEmail: to,
        recipientName,
        subject,
        body,
        metadata: {
          type: "invoice",
          invoiceNumber,
          documentId: invoiceDocument.id,
          pdfPath: invoiceDocument.fileUrl,
        },
        autoAttachDocumentFile: {
          fileUrl: invoiceDocument.fileUrl,
          fileName: `Invoice-${invoiceNumber}.pdf`,
        },
      });

      // Update invoice status to sent
      await apiRequest("PATCH", `/api/orders/${orderId}/invoice`, {
        status: "sent",
      });
    },
    onSuccess: () => {
      toast({ title: "Invoice sent!", description: `Email sent to ${to}` });
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}/invoice`] });
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
            Send Invoice
          </DialogTitle>
          <DialogDescription>
            Send Invoice #{invoiceNumber} to your client via email.
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
            <p className="text-xs text-gray-400 mt-1">The invoice PDF will be attached to the email.</p>
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
            Send Invoice
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
