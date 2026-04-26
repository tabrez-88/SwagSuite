import { buildPurchaseOrderPdf } from "@/components/documents/pdf/builders";
import { useToast } from "@/hooks/use-toast";
import { buildItemsHash, useDocumentGeneration } from "@/hooks/useDocumentGeneration";
import { useInlineEdit } from "@/hooks/useInlineEdit";
import { getEditedItem } from "@/lib/projectDetailUtils";
import { computePOGroups } from "@/lib/poGrouping";
import { useUpdatePODocMeta } from "@/services/documents/mutations";
import { fetchNextPoSequence } from "@/services/documents/requests";
import {
  usePurchaseOrders,
  useCreatePurchaseOrder,
  useAdvancePOStage,
  useSendPOConfirmation,
  type PurchaseOrderEntity,
} from "@/services/purchase-orders";
import { useBranding } from "@/services/settings";
import { fetchSupplierAddresses } from "@/services/supplier-addresses";
import type { OrderItemLine, GeneratedDocument } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import type { PurchaseOrdersSectionProps, VendorPO, VendorArtwork } from "./types";

export function usePurchaseOrdersSection({ projectId, data, isLocked }: PurchaseOrdersSectionProps) {
  const { order, orderVendors, orderItems, allItemLines, allItemCharges, allArtworkItems, suppliers } = data;
  const { toast } = useToast();
  const { updateField, isPending: isFieldPending } = useInlineEdit({ projectId, isLocked });

  const { data: branding} = useBranding();

  // Fetch PO entities from DB
  const orderId = order?.id as string | undefined;
  const { data: poEntities = [] } = usePurchaseOrders(orderId);
  const createPOMutation = useCreatePurchaseOrder(orderId || "");

  // Lookup PO entity by groupKey
  const getPOEntity = useCallback((groupKey: string): PurchaseOrderEntity | null => {
    return poEntities.find((e) => e.groupKey === groupKey) || null;
  }, [poEntities]);

  // Fetch supplier addresses for every vendor on this order.
  const vendorIds = orderVendors.map((v) => v.id).filter(Boolean);
  const supplierAddressQueries = useQuery<Record<string, Record<string, unknown>[]>>({
    queryKey: ["/api/supplier-addresses", vendorIds.join(",")],
    queryFn: async () => {
      const result: Record<string, Record<string, unknown>[]> = {};
      await Promise.all(
        vendorIds.map(async (vid: string) => {
          try {
            result[vid] = await fetchSupplierAddresses(vid);
          } catch { /* ignore */ }
        }),
      );
      return result;
    },
    enabled: vendorIds.length > 0,
  });
  const vendorAddressesMap = supplierAddressQueries.data || {};

  // Get default address for a vendor
  const getVendorDefaultAddress = useCallback((vendorId: string) => {
    const addresses = vendorAddressesMap[vendorId] || [];
    if (addresses.length === 0) return null;
    const defaultAddr = addresses.find((a) => a.isDefault && (a.addressType === "billing" || a.addressType === "both"));
    return defaultAddr || addresses.find((a) => a.isDefault) || addresses[0];
  }, [vendorAddressesMap]);

  const {
    poDocuments,
    isGenerating,
    generateDocument,
    deleteDocument,
  } = useDocumentGeneration(projectId);

  // Build PO groups (items grouped by vendor + address + dates + shipping method + account)
  const vendorPOs: VendorPO[] = useMemo(() => {
    return computePOGroups(orderItems, orderVendors, allItemLines, allArtworkItems, data.allArtworkCharges, order);
  }, [orderItems, orderVendors, allItemLines, allArtworkItems, data, order]);

  const grandTotalCost = vendorPOs.reduce((s, po) => s + po.totalCost, 0);
  const grandTotalQty = vendorPOs.reduce((s, po) => s + po.totalQty, 0);

  // PO group hashes for stale detection (keyed by groupKey)
  const vendorHashes = useMemo(() => {
    const hashes: Record<string, string> = {};
    for (const group of vendorPOs) {
      hashes[group.groupKey] = buildItemsHash(group.items, "po", order);
    }
    return hashes;
  }, [vendorPOs, order]);

  const getVendorDoc = (groupKey: string) => {
    return poDocuments.find((d) => (d.metadata as Record<string, unknown>)?.groupKey === groupKey)
      || poDocuments.find((d) => (d.metadata as Record<string, unknown>)?.vendorKey === groupKey)
      || poDocuments.find((d) => d.vendorId === groupKey);
  };

  const orderExt = order as (typeof order) & { shippingCity?: string; shippingState?: string } | undefined;
  const hasShippingAddress = !!order?.shippingAddress ||
    !!(orderExt?.shippingCity && orderExt?.shippingState);

  const getVendorShippingReady = (groupKey: string): { ready: boolean; configured: number; total: number } => {
    const group = vendorPOs.find((g) => g.groupKey === groupKey);
    if (!group) return { ready: false, configured: 0, total: 0 };
    const configured = group.items.filter((i) => i.shippingDestination).length;
    return { ready: configured === group.items.length && group.items.length > 0, configured, total: group.items.length };
  };

  const allShippingConfigured = orderItems.length > 0 && orderItems.every((i) => i.shippingDestination);
  const hasSupplierIHD = !!order?.supplierInHandsDate;

  // Internal helper for building vendor artworks (used by buildVendorPoDoc)
  const getVendorArtworks = (groupKey: string) => {
    const group = vendorPOs.find((g) => g.groupKey === groupKey);
    if (!group) return [];
    const artworks: VendorArtwork[] = [];
    group.items.forEach((item) => {
      const arts = allArtworkItems?.[item.id] || [];
      arts.forEach((art) => {
        artworks.push({
          ...art,
          productName: item.productName || "Unknown Product",
          orderItemId: item.id,
          supplierName: group.vendor.name || groupKey,
        });
      });
    });
    return artworks;
  };

  // ── Mutations ──

  // Raw doc meta mutation (no activity logging — used for initial metadata on generate)
  const _updatePODocMeta = useUpdatePODocMeta(projectId);

  // Build a PO PDF element for a specific group
  const buildVendorPoDoc = useCallback((groupKey: string) => {
    const group = vendorPOs.find((g) => g.groupKey === groupKey);
    if (!group) return null;
    const { vendor, items } = group;
    const isDecorator = vendor.role === "decorator";
    const vendorId = vendor.id || groupKey;
    const suffix = isDecorator ? `DEC-${vendorId.substring(0, 4).toUpperCase()}` : vendorId.substring(0, 4).toUpperCase();
    const poNumber = `${order?.orderNumber || projectId}-${suffix}`;
    const docMeta = getVendorDoc(groupKey)?.metadata as Record<string, unknown> | null;
    return buildPurchaseOrderPdf({
      order,
      vendor,
      vendorItems: items,
      poNumber,
      artworkItems: getVendorArtworks(groupKey),
      allArtworkCharges: data.allArtworkCharges || {},
      allItemCharges: data.allItemCharges || {},
      serviceCharges: data.serviceCharges || [],
      vendorIHD: (docMeta?.supplierIHD as string) || group.shipInHandsDate || null,
      vendorFirm: group.shipFirm ?? null,
      shippingAccountName: (docMeta?.shippingAccountName as string) || null,
      shippingAccountNumber: (docMeta?.shippingAccountNumber as string) || null,
      vendorAddress: getVendorDefaultAddress(vendor.id),
      poType: isDecorator ? "decorator" : "supplier",
      sellerName: branding?.companyName ?? undefined,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendorPOs, order, data, branding]);

  const handleGeneratePO = async (groupKey: string, vendorNameStr: string) => {
    const group = vendorPOs.find((g) => g.groupKey === groupKey);
    if (!group) return;
    const { vendor } = group;
    const vendorId = vendor.id || groupKey;
    const isDecorator = vendor.role === "decorator";

    if (!hasSupplierIHD && !isDecorator) {
      toast({ title: "Supplier In-Hands Date required", description: "Please set the default Supplier In-Hands Date above. You can override per vendor after generating.", variant: "destructive" });
      return;
    }
    if (!hasShippingAddress) {
      toast({ title: "Missing shipping address", description: "Please set a shipping address before generating POs.", variant: "destructive" });
      return;
    }
    const vendorShipping = getVendorShippingReady(groupKey);
    if (!vendorShipping.ready && !isDecorator) {
      toast({
        title: "Incomplete shipping details",
        description: `${vendorShipping.configured}/${vendorShipping.total} products have shipping details. Configure all in the Shipping tab first.`,
        variant: "destructive",
      });
      return;
    }
    const pdfDoc = buildVendorPoDoc(groupKey);
    if (!pdfDoc) return;
    let poNumber: string;
    try {
      const { next } = await fetchNextPoSequence();
      const seq = String(next).padStart(2, "0");
      poNumber = `${order?.orderNumber || projectId}-${seq}`;
    } catch {
      const suffix = isDecorator ? `DEC-${vendorId.substring(0, 4).toUpperCase()}` : vendorId.substring(0, 4).toUpperCase();
      poNumber = `${order?.orderNumber || projectId}-${suffix}`;
    }
    try {
      const newDoc = await generateDocument({
        pdfDocument: pdfDoc,
        documentType: "purchase_order",
        documentNumber: poNumber,
        vendorId: vendorId,
        vendorName: vendorNameStr,
        itemsHash: vendorHashes[groupKey],
      });
      const orderIHD = order?.supplierInHandsDate;
      if (newDoc?.id) {
        const meta: Record<string, unknown> = {
          ...(newDoc.metadata as Record<string, unknown> || {}),
          vendorKey: vendor.vendorKey || vendor.id,
          groupKey,
          poType: isDecorator ? "decorator" : "supplier",
        };
        if (orderIHD && !isDecorator) {
          meta.supplierIHD = new Date(orderIHD as unknown as string).toISOString().split("T")[0];
        }
        await _updatePODocMeta.mutateAsync({
          docId: newDoc.id,
          updates: { metadata: meta },
        });

        // Create PO entity if it doesn't exist yet
        if (orderId && !getPOEntity(groupKey)) {
          try {
            await createPOMutation.mutateAsync({
              poNumber,
              vendorId,
              vendorRole: isDecorator ? "decorator" : "supplier",
              groupKey,
              documentId: newDoc.id,
              orderItemIds: group.items.map((i) => i.id),
              metadata: {
                shipToAddress: group.shipToAddress,
                shipInHandsDate: group.shipInHandsDate,
                shipFirm: group.shipFirm,
                shippingMethod: group.shippingMethod,
                shippingAccountId: group.shippingAccountId,
              },
            });
          } catch { /* entity creation is best-effort */ }
        }
      }
      toast({ title: `PO PDF generated for ${vendorNameStr}` });
    } catch { /* handled */ }
  };

  const handleGenerateAllPOs = async () => {
    const targets = vendorPOs.filter((g) => !getVendorDoc(g.groupKey));
    if (targets.length === 0) {
      toast({ title: "All POs already generated" });
      return;
    }
    for (const group of targets) {
      await handleGeneratePO(group.groupKey, group.vendor.name);
    }
    toast({ title: `Generated ${targets.length} PO${targets.length > 1 ? "s" : ""}` });
  };

  const itemsMissingDecorator = useMemo(() => {
    return orderItems.filter((item) => {
      const hasArtwork = (allArtworkItems[item.id] || []).length > 0;
      const isThirdParty = item.decoratorType === "third_party" && item.decoratorId;
      return hasArtwork && !isThirdParty;
    });
  }, [orderItems, allArtworkItems]);

  const handleRegeneratePO = async (doc: GeneratedDocument) => {
    await deleteDocument(doc.id);
    await new Promise((r) => setTimeout(r, 300));
    const meta = doc.metadata as Record<string, unknown> | null;
    const groupKey = (meta?.groupKey as string) || doc.vendorId || "";
    const group = vendorPOs.find((g) => g.groupKey === groupKey);
    const vendorName = group?.vendor.name || doc.vendorName || "";
    await handleGeneratePO(groupKey, vendorName);
  };

  // Collect all sendable proofs across ALL groups (for "Send All" button in header)
  const getAllSendableProofs = () => {
    const allProofs: VendorArtwork[] = [];
    for (const group of vendorPOs) {
      group.items.forEach((item) => {
        const arts = allArtworkItems?.[item.id] || [];
        arts.forEach((art) => {
          const a = {
            ...art,
            productName: item.productName || "Unknown Product",
            orderItemId: item.id,
            supplierName: group.vendor.name || group.groupKey,
          } as VendorArtwork;
          if (a.proofRequired !== false && a.proofFilePath && ["proof_received", "change_requested"].includes(a.status)) {
            allProofs.push(a);
          }
        });
      });
    }
    return allProofs;
  };

  return {
    // Data
    order,
    orderItems,
    allItemCharges,
    allArtworkItems,
    allArtworkCharges: data.allArtworkCharges || {},
    suppliers,
    data,
    isLocked,
    projectId,
    // PDF preview
    buildVendorPoDoc,
    // Vendors
    vendorPOs,
    grandTotalCost,
    grandTotalQty,
    vendorHashes,
    // Documents
    isGenerating,
    getVendorDoc,
    handleGeneratePO,
    handleGenerateAllPOs,
    itemsMissingDecorator,
    handleRegeneratePO,
    getEditedItem,
    // Shipping
    hasShippingAddress,
    allShippingConfigured,
    hasSupplierIHD,
    // Inline edit
    updateField,
    isFieldPending,
    // Proofing
    getAllSendableProofs,
    // PO entities
    poEntities,
    getPOEntity,
    // Vendor addresses
    getVendorDefaultAddress,
  };
}
