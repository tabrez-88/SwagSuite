import EmailComposer from "@/components/email/EmailComposer";
import type { EmailContact } from "@/components/email/types";
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Mail } from "lucide-react";
import type { GeneratedDocument } from "@shared/schema";
import type { OrderVendor, EnrichedOrderItem } from "@/types/project-types";
import { useEmailVendor } from "./hooks";

export interface EmailVendorProps {
  open: boolean;
  onClose: () => void;
  doc: GeneratedDocument | null;
  vendor: OrderVendor | null;
  order: Record<string, unknown> | null;
  projectId: string;
  poMergeData: Record<string, string>;
  orderItems: EnrichedOrderItem[];
  allArtworkItems: Record<string, Array<Record<string, unknown>>>;
}

export default function EmailVendor({
  open, onClose, doc, vendor, order, projectId,
  poMergeData, orderItems, allArtworkItems,
}: EmailVendorProps) {
  const { poVendorContacts, sendPOEmailMutation } = useEmailVendor({
    projectId,
    vendorId: vendor?.id,
    orderItems,
    allArtworkItems,
    onSuccess: onClose,
  });

  if (!doc || !vendor) return null;

  const ihd = (doc.metadata as Record<string, unknown> | undefined)?.supplierIHD || order?.supplierInHandsDate;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" /> Email PO to Vendor
          </DialogTitle>
          <DialogDescription>
            Send PO #{doc.documentNumber} to {vendor.name}. The PO PDF link will be included.
          </DialogDescription>
        </DialogHeader>
        <EmailComposer
          contacts={poVendorContacts.length > 0 ? poVendorContacts.map((c) => ({
            id: String(c.id),
            firstName: c.firstName || "",
            lastName: c.lastName || "",
            email: c.email || "",
            isPrimary: c.isPrimary,
            title: c.title,
            receiveOrderEmails: c.receiveOrderEmails,
          } as EmailContact)) : undefined}
          defaults={{
            to: vendor.email || "",
            toName: vendor.contactPerson || vendor.name || "",
            subject: `${order?.isFirm ? "FIRM - " : ""}Purchase Order #${doc.documentNumber} - ${order?.orderNumber || ""}`,
            body: `Hi ${vendor.contactPerson || vendor.name || "there"},\n\nPlease find the attached purchase order for your review and confirmation.\n\nOrder #: ${order?.orderNumber || ""}\nPO #: ${doc.documentNumber || ""}\n${ihd ? `In-Hands Date: ${new Date(ihd as string).toLocaleDateString()}` : ""}\n\nPlease confirm receipt and acknowledge this order.\n\nThank you.`,
          }}
          templateType="purchase_order"
          templateMergeData={poMergeData}
          showAdvancedFields
          showAttachments
          contextProjectId={String(order?.id || "")}
          footerHint="The PO PDF and artwork files will be automatically attached. You can also attach additional files above."
          onSend={(formData) => {
            sendPOEmailMutation.mutate({ doc, formData });
          }}
          isSending={sendPOEmailMutation.isPending}
          sendLabel="Send PO"
          onCancel={onClose}
          resetTrigger={open ? doc : null}
        />
      </DialogContent>
    </Dialog>
  );
}
