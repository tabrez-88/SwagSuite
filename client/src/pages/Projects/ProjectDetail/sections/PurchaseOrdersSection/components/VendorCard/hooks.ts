import { useToast } from "@/hooks/use-toast";
import { useProductionStages } from "@/hooks/useProductionStages";
import { postActivity } from "@/services/activities";
import { useUpdatePODocMeta } from "@/services/documents/mutations";
import { useUpdateArtwork } from "@/services/project-items/mutations";
import { useNextActionTypesQuery } from "@/services/production/queries";
import { projectKeys } from "@/services/projects/keys";
import { useGenerateApproval } from "@/services/projects/mutations";
import type { GeneratedDocument } from "@shared/schema";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import type { VendorArtwork, VendorPO } from "../../types";
import { PROOF_STATUSES } from "../../types";

interface UseVendorCardMutationsParams {
  projectId: string;
  po: VendorPO;
  vendorItemsHash: string;
  allArtworkItems: Record<string, Array<Record<string, unknown>>>;
  primaryContact?: { firstName?: string; lastName?: string; email?: string } | null;
  companyName: string;
}

export function useVendorCardMutations({
  projectId, po, vendorItemsHash, allArtworkItems, primaryContact, companyName,
}: UseVendorCardMutationsParams) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { stages: productionStages } = useProductionStages();
  const { data: actionTypes = [] } = useNextActionTypesQuery();

  // Build PO_STAGES lookup from production stages
  const PO_STAGES: Record<string, { label: string; color: string }> = useMemo(() => {
    const map: Record<string, { label: string; color: string }> = {};
    for (const s of productionStages) {
      map[s.id] = { label: s.name, color: s.color };
    }
    return map;
  }, [productionStages]);

  // Compute vendor artworks from po.items + allArtworkItems
  const vendorArtworks: VendorArtwork[] = useMemo(() => {
    const artworks: VendorArtwork[] = [];
    po.items.forEach((item) => {
      const arts = allArtworkItems?.[item.id] || [];
      arts.forEach((art) => {
        artworks.push({
          ...art,
          productName: item.productName || "Unknown Product",
          orderItemId: item.id,
          supplierName: po.vendor.name || po.vendor.id,
        } as VendorArtwork);
      });
    });
    return artworks;
  }, [po.items, po.vendor, allArtworkItems]);

  // Metadata helpers
  const getDocStage = (doc: GeneratedDocument): string =>
    (doc.metadata as Record<string, unknown>)?.poStage as string || "created";

  const getDocStatus = (doc: GeneratedDocument): string =>
    (doc.metadata as Record<string, unknown>)?.poStatus as string || "ok";

  const isVendorDocStale = (doc: GeneratedDocument): boolean => {
    const meta = doc.metadata as Record<string, unknown> | null;
    if (!meta?.itemsHash) return false;
    return meta.itemsHash !== vendorItemsHash;
  };

  // Update PO doc metadata with activity logging
  const _updatePODocMeta = useUpdatePODocMeta(projectId);
  const updateDocMetaMutation = useMemo(() => ({
    ..._updatePODocMeta,
    mutate: ({ docId, updates }: { docId: string; updates: Record<string, unknown> }, opts?: Record<string, unknown>) => {
      const newStage = (updates.metadata as Record<string, unknown> | undefined)?.poStage;
      let activityContent: string | undefined;
      if (newStage) {
        const stageLabel = PO_STAGES[newStage as string]?.label || String(newStage);
        activityContent = `PO stage changed to "${stageLabel}"`;
      }
      _updatePODocMeta.mutate({ docId, updates, activityContent }, opts);
    },
  }), [_updatePODocMeta, PO_STAGES]);

  // Update artwork with activity logging
  const _updateArtwork = useUpdateArtwork(projectId);
  const updateArtworkMutation = useMemo(() => ({
    ..._updateArtwork,
    mutate: (
      { artworkId, orderItemId, updates }: { artworkId: string; orderItemId: string; updates: Record<string, unknown> },
      opts?: { onSuccess?: (...args: unknown[]) => void },
    ) => {
      _updateArtwork.mutate({ itemId: orderItemId, artworkId, updates }, {
        ...opts,
        onSuccess: (...args: unknown[]) => {
          const newStatus = updates.status;
          if (newStatus) {
            const statusLabel = PROOF_STATUSES[newStatus as keyof typeof PROOF_STATUSES]?.label || newStatus;
            const artName = updates.name || "Artwork";
            postActivity(projectId, {
              activityType: "system_action",
              content: `Proof status for "${artName}" changed to "${statusLabel}"`,
            }).catch(() => { /* best-effort */ });
            queryClient.invalidateQueries({ queryKey: projectKeys.activities(projectId) });
          }
          opts?.onSuccess?.(...args);
        },
      });
    },
  }), [_updateArtwork, projectId, queryClient]);

  // Approval link generation
  const generateApprovalMutation = useGenerateApproval(projectId);

  const handleOpenArtworkApprovalLink = useCallback(async (art: VendorArtwork) => {
    const fallbackEmail = primaryContact?.email || "";
    if (!fallbackEmail) {
      toast({ title: "No client email", description: "Set a primary contact email for this project to generate an approval link.", variant: "destructive" });
      return;
    }
    try {
      const approval = await generateApprovalMutation.mutateAsync({
        orderItemId: art.orderItemId,
        artworkItemId: art.id,
        clientEmail: fallbackEmail,
        clientName: primaryContact ? `${primaryContact.firstName || ""} ${primaryContact.lastName || ""}`.trim() : companyName || "",
      });
      const approvalUrl = `${window.location.origin}/approval/${approval.approvalToken}`;
      window.open(approvalUrl, "_blank", "noopener,noreferrer");
    } catch {
      toast({ title: "Failed to open approval link", variant: "destructive" });
    }
  }, [primaryContact, companyName, generateApprovalMutation, toast]);

  return {
    PO_STAGES,
    actionTypes,
    vendorArtworks,
    getDocStage,
    getDocStatus,
    isVendorDocStale,
    updateDocMetaMutation,
    updateArtworkMutation,
    handleOpenArtworkApprovalLink,
  };
}
