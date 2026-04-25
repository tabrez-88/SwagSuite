import EmailComposer from "@/components/email/EmailComposer";
import {
  Dialog, DialogContent,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { sendCommunication } from "@/services/communications";
import { Send } from "lucide-react";
import type { OrderVendor } from "@/types/project-types";

export interface NotifyVendorProps {
  open: boolean;
  onClose: () => void;
  vendor: OrderVendor | null;
  subject?: string;
  body?: string;
  projectId: string;
}

export default function NotifyVendor({
  open, onClose, vendor, subject, body, projectId,
}: NotifyVendorProps) {
  const { toast } = useToast();

  if (!vendor) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-5 h-5" /> Email Vendor — {vendor.name}
          </DialogTitle>
        </DialogHeader>
        <EmailComposer
          defaults={{
            to: vendor.email || "",
            toName: vendor.name || "",
            subject: subject || "",
            body: body || "",
          }}
          autoFillSender
          onSend={async (formData) => {
            await sendCommunication(projectId, {
              communicationType: "vendor_email",
              direction: "sent",
              recipientEmail: formData.to,
              recipientName: formData.toName,
              subject: formData.subject,
              body: formData.body,
              cc: formData.cc || undefined,
              bcc: formData.bcc || undefined,
              metadata: { type: "vendor_notification", vendorId: vendor.id },
            });
            toast({ title: "Email sent to vendor" });
            onClose();
          }}
          onCancel={onClose}
          sendLabel="Send Email"
        />
      </DialogContent>
    </Dialog>
  );
}
