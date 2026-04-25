import type { EmailFormData } from "@/components/email/types";
import { useToast } from "@/hooks/use-toast";
import { sendCommunication } from "@/services/communications";
import { useGenerateApproval } from "@/services/projects/mutations";
import { useMutation } from "@tanstack/react-query";
import type { VendorArtwork } from "../../types";

interface UseEmailClientProofParams {
  projectId: string;
  orderNumber: string;
  updateArtworkMutate: (params: { artworkId: string; orderItemId: string; updates: Record<string, unknown> }) => void;
  onSuccess: () => void;
}

export function useEmailClientProof({
  projectId, orderNumber, updateArtworkMutate, onSuccess,
}: UseEmailClientProofParams) {
  const { toast } = useToast();
  const generateApprovalMutation = useGenerateApproval(projectId);

  const sendBatchProofMutation = useMutation({
    mutationFn: async ({ artworks, formData }: { artworks: VendorArtwork[]; formData: EmailFormData & { adHocEmails: string[] } }) => {
      const approvalLinks: { art: VendorArtwork; url: string }[] = [];
      for (const art of artworks) {
        const approval = await generateApprovalMutation.mutateAsync({
          orderItemId: art.orderItemId,
          artworkItemId: art.id,
          clientEmail: formData.to,
          clientName: formData.toName,
        });
        const approvalUrl = `${window.location.origin}/approval/${approval.approvalToken}`;
        approvalLinks.push({ art, url: approvalUrl });
      }

      const linksList = approvalLinks.map((link, idx) => {
        const art = link.art;
        return `${idx + 1}. ${art.productName} — ${art.location || art.artworkType || "Artwork"}\n   Review & Approve: ${link.url}`;
      }).join("\n\n");

      const linksBlock = `---\nArtwork Proofs for Approval:\n\n${linksList}\n---`;

      // Replace merge tags
      let emailBodyFull = formData.body;
      const mergeTagSpanRe = /<span\s+data-merge-tag="artworkApprovalLink"[^>]*>.*?<\/span>/g;
      const bareMergeRe = /\{\{artworkApprovalLink\}\}/g;
      const legacyRe = /\{\{approvalLinks\}\}/g;

      if (mergeTagSpanRe.test(emailBodyFull) || bareMergeRe.test(emailBodyFull) || legacyRe.test(emailBodyFull)) {
        emailBodyFull = emailBodyFull
          .replace(mergeTagSpanRe, linksBlock)
          .replace(bareMergeRe, linksBlock)
          .replace(legacyRe, linksBlock);
      } else {
        emailBodyFull = `${emailBodyFull}\n\n${linksBlock}`;
      }

      // Collect proof + original artwork files as attachments
      const proofAttachments = artworks
        .filter((art) => art.proofFilePath || art.filePath)
        .map((art) => ({
          fileUrl: art.proofFilePath || art.filePath,
          fileName: art.proofFileName || art.fileName || `proof-${art.name || "artwork"}.pdf`,
        }));

      await sendCommunication(projectId, {
        communicationType: "client_email", direction: "sent",
        fromEmail: formData.from || undefined,
        fromName: formData.fromName || undefined,
        recipientEmail: formData.to, recipientName: formData.toName,
        subject: `Artwork Proofs for Approval - Order #${orderNumber} (${artworks.length} item${artworks.length > 1 ? "s" : ""})`,
        body: emailBodyFull,
        cc: formData.cc || undefined,
        bcc: formData.bcc || undefined,
        metadata: { type: "proof_approval_batch", artworkIds: artworks.map(a => a.id), approvalLinks: approvalLinks.map(l => l.url) },
        additionalAttachments: proofAttachments.length > 0 ? proofAttachments : undefined,
      });

      return approvalLinks;
    },
    onSuccess: (approvalLinks) => {
      for (const link of approvalLinks) {
        updateArtworkMutate({
          artworkId: link.art.id, orderItemId: link.art.orderItemId,
          updates: { name: link.art.name, status: "pending_approval" },
        });
      }
      toast({ title: "Proofs sent to client!", description: `${approvalLinks.length} approval link${approvalLinks.length > 1 ? "s" : ""} sent.` });
      onSuccess();
    },
    onError: () => toast({ title: "Failed to send proofs", variant: "destructive" }),
  });

  return { sendBatchProofMutation, generateApprovalMutation };
}
