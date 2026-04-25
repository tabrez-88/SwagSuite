import type { EmailFormData } from "@/components/email/types";
import { useToast } from "@/hooks/use-toast";
import { sendCommunication } from "@/services/communications";
import { useUpdatePODocMeta } from "@/services/documents/mutations";
import { updateArtwork as updateArtworkRequest } from "@/services/project-items";
import { projectKeys } from "@/services/projects/keys";
import { useVendorContacts } from "@/services/suppliers";
import type { GeneratedDocument } from "@shared/schema";
import type { EnrichedOrderItem } from "@/types/project-types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import type { VendorArtwork } from "../../types";

interface UseEmailVendorParams {
  projectId: string;
  vendorId: string | undefined;
  orderItems: EnrichedOrderItem[];
  allArtworkItems: Record<string, Array<Record<string, unknown>>>;
  onSuccess: () => void;
}

export function useEmailVendor({
  projectId, vendorId, orderItems, allArtworkItems, onSuccess,
}: UseEmailVendorParams) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: poVendorContacts = [] } = useVendorContacts(vendorId, !!vendorId);

  // Own doc meta mutation with activity logging for stage changes
  const _updatePODocMeta = useUpdatePODocMeta(projectId);

  // Compute vendor artworks from orderItems + allArtworkItems
  const getVendorArtworks = useMemo(() => {
    return (vKey: string) => {
      const vendorItems = orderItems.filter((i) => i.supplierId === vKey || (i.decoratorType === "third_party" && i.decoratorId === vKey));
      const artworks: VendorArtwork[] = [];
      vendorItems.forEach((item) => {
        const arts = allArtworkItems?.[item.id] || [];
        arts.forEach((art) => {
          artworks.push({
            ...art,
            productName: item.productName || "Unknown Product",
            orderItemId: item.id,
            supplierName: vKey,
          } as VendorArtwork);
        });
      });
      return artworks;
    };
  }, [orderItems, allArtworkItems]);

  const sendPOEmailMutation = useMutation({
    mutationFn: async ({ doc, formData }: { doc: GeneratedDocument; formData: EmailFormData & { adHocEmails: string[] } }) => {
      const userAttachments = formData.attachments?.length
        ? formData.attachments.map((att) => ({ fileUrl: att.cloudinaryUrl, fileName: att.fileName }))
        : undefined;

      await sendCommunication(projectId, {
        communicationType: "vendor_email",
        direction: "sent",
        recipientEmail: formData.to,
        recipientName: formData.toName,
        subject: formData.subject,
        body: formData.body,
        cc: formData.cc || undefined,
        bcc: formData.bcc || undefined,
        metadata: { type: "purchase_order", documentId: doc.id, vendorId: doc.vendorId },
        autoAttachArtworkForVendor: doc.vendorId,
        autoAttachDocumentFile: doc.fileUrl ? { fileUrl: doc.fileUrl, fileName: (doc as GeneratedDocument & { fileName?: string }).fileName || `PO-${doc.documentNumber}.pdf` } : undefined,
        additionalAttachments: userAttachments,
      });

      // Only advance stage to "submitted" on first send
      const docMeta = (doc.metadata || {}) as Record<string, unknown>;
      const currentStage = (docMeta.poStage as string) || "created";
      const newStage = currentStage === "created" ? "submitted" : currentStage;
      const activityContent = currentStage === "created" ? `PO stage changed to "Submitted"` : undefined;
      await _updatePODocMeta.mutateAsync({
        docId: doc.id,
        updates: {
          status: "sent",
          sentAt: new Date().toISOString(),
          metadata: { ...docMeta, poStage: newStage },
        },
        activityContent,
      });
    },
    onSuccess: async (_data, vars) => {
      toast({ title: "PO sent to vendor!", description: "Email sent successfully." });
      // Auto-transition artworks to "awaiting_proof" when PO is sent
      const vendorKey = vars.doc.vendorId || "";
      const vendorArts = getVendorArtworks(vendorKey);
      for (const art of vendorArts) {
        if (art.proofRequired !== false && art.status === "pending") {
          try {
            await updateArtworkRequest(art.orderItemId, art.id, { name: art.name, status: "awaiting_proof" });
          } catch { /* best effort */ }
        }
      }
      queryClient.invalidateQueries({ queryKey: projectKeys.itemsWithDetails(projectId) });
      onSuccess();
    },
    onError: () => toast({ title: "Failed to send PO", variant: "destructive" }),
  });

  return { poVendorContacts, sendPOEmailMutation };
}
