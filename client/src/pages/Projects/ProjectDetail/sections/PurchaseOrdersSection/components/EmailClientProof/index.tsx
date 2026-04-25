import EmailComposer from "@/components/email/EmailComposer";
import type { EmailContact } from "@/components/email/types";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Palette, Send } from "lucide-react";
import type { VendorArtwork } from "../../types";
import { PROOF_STATUSES } from "../../types";
import type { EnrichedOrderItem } from "@/types/project-types";
import { useEmailClientProof } from "./hooks";

interface Supplier {
  id: string;
  name: string;
}

export interface EmailClientProofProps {
  open: boolean;
  onClose: () => void;
  sendProofArts: VendorArtwork[];
  data: {
    companyName?: string;
    primaryContact?: { firstName?: string; lastName?: string; email?: string } | null;
    contacts?: Array<{
      id: string | number;
      firstName?: string;
      lastName?: string;
      email: string;
      isPrimary?: boolean;
      title?: string;
      receiveOrderEmails?: boolean;
    }>;
    assignedUser?: { email?: string };
  };
  order: Record<string, unknown> | null;
  orderItems: EnrichedOrderItem[];
  suppliers: Supplier[];
  proofMergeData: Record<string, string>;
  projectId: string;
  updateArtworkMutate: (params: { artworkId: string; orderItemId: string; updates: Record<string, unknown> }) => void;
}

export default function EmailClientProof({
  open, onClose, sendProofArts, data, order,
  orderItems, suppliers, proofMergeData, projectId, updateArtworkMutate,
}: EmailClientProofProps) {
  const { sendBatchProofMutation } = useEmailClientProof({
    projectId,
    orderNumber: (order?.orderNumber as string) || "",
    updateArtworkMutate,
    onSuccess: onClose,
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-5 h-5" /> Send Proofs to Client
          </DialogTitle>
          <DialogDescription>
            Send {sendProofArts.length} artwork proof{sendProofArts.length > 1 ? "s" : ""} to your client for approval. One email will be sent with all approval links.
          </DialogDescription>
        </DialogHeader>
        <EmailComposer
          contacts={data.contacts && data.contacts.length > 0 ? data.contacts.map((c) => ({
            id: String(c.id),
            firstName: c.firstName || "",
            lastName: c.lastName || "",
            email: c.email,
            isPrimary: c.isPrimary,
            title: c.title,
            receiveOrderEmails: c.receiveOrderEmails,
          } as EmailContact)) : undefined}
          defaults={{
            to: data.primaryContact?.email || "",
            toName: data.primaryContact ? `${data.primaryContact.firstName} ${data.primaryContact.lastName}` : data.companyName || "",
            cc: (data as unknown as { assignedUser?: { email?: string } })?.assignedUser?.email || "",
            subject: `Artwork Proofs for Review - ${order?.orderNumber || ""}`,
            body: (() => {
              const pc = data.primaryContact;
              const cn = data.companyName || "";
              const artItems = sendProofArts.map((a) => `<li>${a.productName} (${a.location || a.artworkType || "Artwork"})</li>`).join("");
              return `<p>Hi ${pc?.firstName || "there"},</p><p>We've received artwork proofs for your order. Please review each proof and let us know if you'd like to approve or request changes.</p><p>Proofs included:</p><ul>${artItems}</ul><p>Review and approve here: <span data-merge-tag="artworkApprovalLink">{{artworkApprovalLink}}</span></p><p>Best regards,<br>${cn}</p>`;
            })(),
          }}
          templateType="proof"
          templateMergeData={proofMergeData}
          showAdvancedFields
          beforeBody={
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {sendProofArts.map((art) => {
                const vName = (() => {
                  const item = orderItems.find((i) => i.id === art.orderItemId);
                  if (!item?.supplierId) return null;
                  const s = suppliers.find((v) => v.id === item.supplierId);
                  return s?.name || null;
                })();
                return (
                  <div key={art.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg border">
                    <div className="w-10 h-10 flex-shrink-0 bg-white rounded border overflow-hidden">
                      {art.proofFilePath ? (
                        <img src={art.proofFilePath} alt="Proof" className="w-full h-full object-contain p-0.5" />
                      ) : (
                        <Palette className="w-4 h-4 text-gray-300 m-auto mt-2" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{art.productName}</p>
                      <p className="text-[10px] text-gray-500 truncate">
                        {vName && <span className="text-blue-600">{vName}</span>}
                        {vName && " · "}{art.location || art.artworkType || "Artwork"} · {art.proofFileName || "proof"}
                      </p>
                    </div>
                    <Badge className={`text-[10px] ${PROOF_STATUSES[art.status]?.color || ""}`}>
                      {PROOF_STATUSES[art.status]?.label || art.status}
                    </Badge>
                  </div>
                );
              })}
            </div>
          }
          footerHint="Proof files will be attached to the email."
          onSend={(formData) => {
            sendBatchProofMutation.mutate({ artworks: sendProofArts, formData });
          }}
          isSending={sendBatchProofMutation.isPending}
          sendLabel={`Send ${sendProofArts.length} Proof${sendProofArts.length > 1 ? "s" : ""}`}
          onCancel={onClose}
          resetTrigger={sendProofArts.length > 0 ? sendProofArts : null}
        />
      </DialogContent>
    </Dialog>
  );
}
