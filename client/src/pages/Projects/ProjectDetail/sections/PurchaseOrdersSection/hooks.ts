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
  useUpdatePurchaseOrder,
  useAdvancePOStage,
  useSendPOConfirmation,
  type PurchaseOrderEntity,
} from "@/services/purchase-orders";
import { useBranding } from "@/services/settings";
import { fetchSupplierAddresses } from "@/services/supplier-addresses";
import type { OrderItemLine, GeneratedDocument } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo, useRef } from "react";
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
  const updatePOMutation = useUpdatePurchaseOrder(orderId || "");

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
    startBatch,
    endBatch,
  } = useDocumentGeneration(projectId);

  // Build PO groups (items grouped by vendor + address + dates + shipping method + account)
  const vendorPOs: VendorPO[] = useMemo(() => {
    return computePOGroups(orderItems, orderVendors, allItemLines, allArtworkItems, data.allArtworkCharges, order, allItemCharges);
  }, [orderItems, orderVendors, allItemLines, allArtworkItems, data, order, allItemCharges]);

  const grandTotalCost = vendorPOs.reduce((s, po) => s + po.totalCost, 0);
  const grandTotalQty = vendorPOs.reduce((s, po) => s + po.totalQty, 0);

  // PO group hashes for stale detection (keyed by groupKey)
  const vendorHashes = useMemo(() => {
    const hashes: Record<string, string> = {};
    for (const group of vendorPOs) {
      // If PO has custom supplier IHD in doc metadata, use that instead of order-level
      const doc = getVendorDoc(group.groupKey);
      const docMeta = doc?.metadata as Record<string, unknown> | null;
      const effectiveIhd = (docMeta?.supplierIHD as string) || null;
      hashes[group.groupKey] = buildItemsHash(group.items, "po", order, effectiveIhd);
    }
    return hashes;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendorPOs, order, poDocuments]);

  const getVendorDoc = (groupKey: string) => {
    // Prefer exact match via PO entity documentId (most reliable link)
    const entity = getPOEntity(groupKey);
    if (entity?.documentId) {
      const byEntity = poDocuments.find((d) => d.id === entity.documentId);
      if (byEntity) return byEntity;
    }
    // Then match by groupKey in document metadata (only reliable unique key per PO group)
    return poDocuments.find((d) => (d.metadata as Record<string, unknown>)?.groupKey === groupKey) || null;
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
  // Supplier PO: only include artwork for items where supplier decorates (not third_party)
  // Decorator PO: include all artwork
  const getVendorArtworks = (groupKey: string) => {
    const group = vendorPOs.find((g) => g.groupKey === groupKey);
    if (!group) return [];
    const isDecoratorGroup = group.vendor.role === "decorator";
    // Artwork should only appear on decorator POs, not blanks/supplier POs
    if (!isDecoratorGroup) return [];
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
  // Pending revision for regenerate flow
  const _pendingRevision = useRef<number | null>(null);
  // Pending custom metadata to preserve across regenerate (custom IHD, blind ship, etc.)
  const _pendingCustomMeta = useRef<Record<string, Record<string, unknown>>>({});
  // Pending vendor notes (set by VendorCard before PO entity exists)
  const _pendingNotes = useRef<Record<string, { vendorNotes: string; internalNotes: string }>>({});
  // Pending blind ship flag (set by VendorCard before doc exists)
  const _pendingBlindShip = useRef<Record<string, boolean>>({});

  // Build a PO PDF element for a specific group
  // poNumberOverride: when generating, pass the sequential PO number so the PDF
  // content matches the stored document number (avoids preview/generated mismatch).
  const buildVendorPoDoc = useCallback((groupKey: string, poNumberOverride?: string) => {
    const group = vendorPOs.find((g) => g.groupKey === groupKey);
    if (!group) return null;
    const { vendor, items } = group;
    const isDecorator = vendor.role === "decorator";
    const vendorId = vendor.id || groupKey;
    const vendorDoc = getVendorDoc(groupKey);
    const docMeta = vendorDoc?.metadata as Record<string, unknown> | null;
    const poEntityForGroup = getPOEntity(groupKey);
    // Use explicit override first (generation), then DB entity, then doc metadata, then fallback
    const poNumber = poNumberOverride
      || poEntityForGroup?.poNumber
      || (vendorDoc?.documentNumber as string)
      || `${order?.orderNumber || projectId}-${isDecorator ? `DEC-${(vendor.id || groupKey).substring(0, 4).toUpperCase()}` : (vendor.id || groupKey).substring(0, 4).toUpperCase()}`;
    // For supplier POs shipping to decorator, find the decorator group info
    let decName: string | null = null;
    let decPONumber: string | null = null;
    let decAddr: ReturnType<typeof getVendorDefaultAddress> = null;
    if (!isDecorator) {
      const hasThirdParty = items.some((i) => i.decoratorType === "third_party");
      if (hasThirdParty) {
        const decoratorId = items.find((i) => i.decoratorType === "third_party")?.decoratorId;
        if (decoratorId) {
          const decGroup = vendorPOs.find(
            (g) => g.vendor.role === "decorator" && g.vendor.id === decoratorId,
          );
          if (decGroup) {
            decName = decGroup.vendor.name;
            const decEntity = getPOEntity(decGroup.groupKey);
            const decDoc = getVendorDoc(decGroup.groupKey);
            decPONumber = decEntity?.poNumber || (decDoc?.documentNumber as string) || null;
          }
          decAddr = getVendorDefaultAddress(decoratorId);
        }
      }
    }

    return buildPurchaseOrderPdf({
      order,
      vendor,
      vendorItems: items,
      poNumber,
      artworkItems: getVendorArtworks(groupKey),
      allArtworkCharges: data.allArtworkCharges || {},
      allItemCharges: data.allItemCharges || {},
      allItemLines: group.lines,
      vendorIHD: (docMeta?.supplierIHD as string) || group.shipInHandsDate || null,
      vendorFirm: group.shipFirm ?? null,
      shippingAccountName: (docMeta?.shippingAccountName as string) || null,
      shippingAccountNumber: (docMeta?.shippingAccountNumber as string) || null,
      vendorAddress: getVendorDefaultAddress(vendor.id),
      poType: isDecorator ? "decorator" : "supplier",
      decoratorAddress: decAddr,
      sellerName: branding?.companyName ?? undefined,
      vendorNotes: poEntityForGroup?.vendorNotes || _pendingNotes.current[groupKey]?.vendorNotes || null,
      revision: (docMeta?.revision as number) || undefined,
      blindShip: !!(docMeta?.blindShip) || !!(_pendingBlindShip.current[groupKey]),
      decoratorName: decName,
      decoratorPONumber: decPONumber,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendorPOs, order, data, branding, poEntities, poDocuments]);

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
    let poNumber: string;
    try {
      const { next } = await fetchNextPoSequence(projectId);
      const seq = String(next).padStart(2, "0");
      poNumber = `${order?.orderNumber || projectId}-${seq}`;
    } catch {
      const suffix = isDecorator ? `DEC-${vendorId.substring(0, 4).toUpperCase()}` : vendorId.substring(0, 4).toUpperCase();
      poNumber = `${order?.orderNumber || projectId}-${suffix}`;
    }
    // Build PDF AFTER resolving PO number so the content matches the stored number
    const pdfDoc = buildVendorPoDoc(groupKey, poNumber);
    if (!pdfDoc) return;
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
          revision: _pendingRevision.current || (newDoc.metadata as Record<string, unknown>)?.revision || 1,
          blindShip: _pendingBlindShip.current[groupKey] || false,
        };
        // Check for preserved custom metadata from regenerate (highest priority)
        const pendingCustom = _pendingCustomMeta.current[groupKey];
        if (pendingCustom?.supplierIHD) {
          meta.supplierIHD = pendingCustom.supplierIHD;
        } else if (isDecorator) {
          // Decorator→Client PO: use order-level supplier IHD
          if (orderIHD) {
            meta.supplierIHD = new Date(orderIHD as unknown as string).toISOString().split("T")[0];
          }
        } else if (orderIHD) {
          // Check if this supplier group has third-party items with a decorator
          const hasThirdParty = group.items.some((i) => i.decoratorType === "third_party");
          if (hasThirdParty) {
            // Supplier→Decorator PO (blank): 1 week before order-level supplier IHD
            const supplierDate = new Date(orderIHD as unknown as string);
            supplierDate.setDate(supplierDate.getDate() - 7);
            meta.supplierIHD = supplierDate.toISOString().split("T")[0];
          } else {
            meta.supplierIHD = new Date(orderIHD as unknown as string).toISOString().split("T")[0];
          }
        }
        // Apply other preserved custom fields from regenerate
        if (pendingCustom?.blindShip !== undefined) meta.blindShip = pendingCustom.blindShip;
        if (pendingCustom?.shippingAccountName) meta.shippingAccountName = pendingCustom.shippingAccountName;
        if (pendingCustom?.shippingAccountNumber) meta.shippingAccountNumber = pendingCustom.shippingAccountNumber;
        // Clear after use
        delete _pendingCustomMeta.current[groupKey];
        await _updatePODocMeta.mutateAsync({
          docId: newDoc.id,
          updates: { metadata: meta },
        });

        // Create or update PO entity
        const existingEntity = getPOEntity(groupKey);
        if (orderId && !existingEntity) {
          const pending = _pendingNotes.current[groupKey];
          try {
            await createPOMutation.mutateAsync({
              poNumber,
              vendorId,
              vendorRole: isDecorator ? "decorator" : "supplier",
              groupKey,
              documentId: newDoc.id,
              orderItemIds: group.items.map((i) => i.id),
              vendorNotes: pending?.vendorNotes || undefined,
              internalNotes: pending?.internalNotes || undefined,
              metadata: {
                shipToAddress: group.shipToAddress,
                shipInHandsDate: group.shipInHandsDate,
                shipFirm: group.shipFirm,
                shippingMethod: group.shippingMethod,
                shippingAccountId: group.shippingAccountId,
              },
            });
          } catch { /* entity creation is best-effort */ }
        } else if (existingEntity && existingEntity.documentId !== newDoc.id) {
          // Regenerate: entity exists but documentId points to the old (deleted) doc
          try {
            await updatePOMutation.mutateAsync({
              id: existingEntity.id,
              data: { documentId: newDoc.id },
            });
          } catch { /* entity update is best-effort */ }
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

    // Batch mode: suppress generateDocument's per-call query invalidation
    // to avoid unnecessary mid-loop refetches (performance optimization).
    startBatch();
    let generated = 0;
    try {
      for (const group of targets) {
        await handleGeneratePO(group.groupKey, group.vendor.name);
        generated++;
      }
    } finally {
      // End batch + single invalidation for all generated docs
      endBatch();
    }
    toast({ title: `Generated ${generated} PO${generated > 1 ? "s" : ""}` });
  };

  const itemsMissingDecorator = useMemo(() => {
    return orderItems.filter((item) => {
      const hasArtwork = (allArtworkItems[item.id] || []).length > 0;
      const isThirdParty = item.decoratorType === "third_party" && item.decoratorId;
      return hasArtwork && !isThirdParty;
    });
  }, [orderItems, allArtworkItems]);

  const handleRegeneratePO = async (doc: GeneratedDocument) => {
    const oldMeta = doc.metadata as Record<string, unknown> | null;
    const oldRevision = (oldMeta?.revision as number) || 1;
    const groupKey = (oldMeta?.groupKey as string) || doc.vendorId || "";

    // Preserve custom metadata from old doc before deleting
    const customFields: Record<string, unknown> = {};
    if (oldMeta?.supplierIHD) customFields.supplierIHD = oldMeta.supplierIHD;
    if (oldMeta?.blindShip) customFields.blindShip = oldMeta.blindShip;
    if (oldMeta?.shippingAccountName) customFields.shippingAccountName = oldMeta.shippingAccountName;
    if (oldMeta?.shippingAccountNumber) customFields.shippingAccountNumber = oldMeta.shippingAccountNumber;
    if (Object.keys(customFields).length > 0) {
      _pendingCustomMeta.current[groupKey] = customFields;
    }

    await deleteDocument(doc.id);
    await new Promise((r) => setTimeout(r, 300));
    const group = vendorPOs.find((g) => g.groupKey === groupKey);
    const vendorName = group?.vendor.name || doc.vendorName || "";
    // Store next revision so handleGeneratePO picks it up
    _pendingRevision.current = oldRevision + 1;
    await handleGeneratePO(groupKey, vendorName);
    _pendingRevision.current = null;
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
    // Pending refs (for VendorCard state before PO entity/doc exists)
    pendingNotesRef: _pendingNotes,
    pendingBlindShipRef: _pendingBlindShip,
  };
}
