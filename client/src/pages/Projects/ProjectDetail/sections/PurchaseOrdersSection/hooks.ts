import { buildPurchaseOrderPdf } from "@/components/documents/pdf/builders";
import { useToast } from "@/hooks/use-toast";
import { buildItemsHash, useDocumentGeneration } from "@/hooks/useDocumentGeneration";
import { useInlineEdit } from "@/hooks/useInlineEdit";
import { getEditedItem } from "@/lib/projectDetailUtils";
import { useUpdatePODocMeta } from "@/services/documents/mutations";
import { fetchNextPoSequence } from "@/services/documents/requests";
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

  // Build PO data per vendor
  const vendorPOs: VendorPO[] = useMemo(() => {
    return orderVendors.map((vendor) => {
      const isDecorator = vendor.role === "decorator";
      const items = isDecorator
        ? orderItems.filter((item) => item.decoratorType === "third_party" && item.decoratorId === vendor.id)
        : orderItems.filter((item) => item.supplierId === vendor.id);

      const lines: Record<string, OrderItemLine[]> = {};
      let totalQty = 0;
      let totalCost = 0;

      if (isDecorator) {
        items.forEach((item) => {
          const itemArts = allArtworkItems[item.id] || [];
          itemArts.forEach((art) => {
            const charges = data.allArtworkCharges?.[art.id] || [];
            charges.forEach((c) => {
              const cost = parseFloat(c.netCost || "0");
              const qty = c.chargeCategory === "run" ? (item.quantity || 1) : (c.quantity || 1);
              totalCost += cost * qty;
            });
          });
          totalQty += item.quantity || 0;
          lines[item.id] = allItemLines[item.id] || [];
        });
      } else {
        items.forEach((item) => {
          const itemLines = allItemLines[item.id] || [];
          lines[item.id] = itemLines;
          if (itemLines.length > 0) {
            itemLines.forEach((l) => {
              const qty = l.quantity || 0;
              const cost = parseFloat(l.cost || "0");
              totalQty += qty;
              totalCost += qty * cost;
            });
          } else {
            const qty = item.quantity || 0;
            const cost = parseFloat(item.cost || item.unitPrice || "0");
            totalQty += qty;
            totalCost += qty * cost;
          }
        });
      }

      return { vendor, items, lines, totalQty, totalCost };
    });
  }, [orderVendors, orderItems, allItemLines, allArtworkItems, data]);

  const grandTotalCost = vendorPOs.reduce((s, po) => s + po.totalCost, 0);
  const grandTotalQty = vendorPOs.reduce((s, po) => s + po.totalQty, 0);

  // Vendor PO hashes for stale detection
  const vendorHashes = useMemo(() => {
    const hashes: Record<string, string> = {};
    for (const vendor of orderVendors) {
      const isDecorator = vendor.role === "decorator";
      const vendorItems = isDecorator
        ? orderItems.filter((i) => i.decoratorType === "third_party" && i.decoratorId === vendor.id)
        : orderItems.filter((i) => i.supplierId === vendor.id);
      const key = vendor.vendorKey || vendor.id;
      hashes[key] = buildItemsHash(vendorItems, "po", order);
    }
    return hashes;
  }, [orderVendors, orderItems, order]);

  const getVendorDoc = (vendorKey: string) => {
    return poDocuments.find((d) => (d.metadata as Record<string, unknown>)?.vendorKey === vendorKey)
      || poDocuments.find((d) => d.vendorId === vendorKey);
  };

  const orderExt = order as (typeof order) & { shippingCity?: string; shippingState?: string } | undefined;
  const hasShippingAddress = !!order?.shippingAddress ||
    !!(orderExt?.shippingCity && orderExt?.shippingState);

  const getVendorShippingReady = (vendorKey: string): { ready: boolean; configured: number; total: number } => {
    const vendor = orderVendors.find((v) => (v.vendorKey || v.id) === vendorKey);
    const isDecorator = vendor?.role === "decorator";
    const items = isDecorator
      ? orderItems.filter((i) => i.decoratorType === "third_party" && i.decoratorId === vendor?.id)
      : orderItems.filter((i) => i.supplierId === vendorKey);
    const configured = items.filter((i) => i.shippingDestination).length;
    return { ready: configured === items.length && items.length > 0, configured, total: items.length };
  };

  const allShippingConfigured = orderItems.length > 0 && orderItems.every((i) => i.shippingDestination);
  const hasSupplierIHD = !!order?.supplierInHandsDate;

  // Internal helper for building vendor artworks (used by buildVendorPoDoc)
  const getVendorArtworks = (vendorKey: string) => {
    const vendor = orderVendors.find((v) => (v.vendorKey || v.id) === vendorKey);
    const isDecorator = vendor?.role === "decorator";
    const vendorItems = isDecorator
      ? orderItems.filter((i) => i.decoratorType === "third_party" && i.decoratorId === vendor?.id)
      : orderItems.filter((i) => i.supplierId === vendorKey);

    const artworks: VendorArtwork[] = [];
    vendorItems.forEach((item) => {
      const arts = allArtworkItems?.[item.id] || [];
      arts.forEach((art) => {
        artworks.push({
          ...art,
          productName: item.productName || "Unknown Product",
          orderItemId: item.id,
          supplierName: vendor?.name || vendorKey,
        });
      });
    });
    return artworks;
  };

  // ── Mutations ──

  // Raw doc meta mutation (no activity logging — used for initial metadata on generate)
  const _updatePODocMeta = useUpdatePODocMeta(projectId);

  // Build a PO PDF element for a specific vendor
  const buildVendorPoDoc = useCallback((vendorKey: string) => {
    const vendor = orderVendors.find((v) => (v.vendorKey || v.id) === vendorKey);
    if (!vendor) return null;
    const isDecorator = vendor.role === "decorator";
    const items = isDecorator
      ? orderItems.filter((i) => i.decoratorType === "third_party" && i.decoratorId === vendor.id)
      : orderItems.filter((i) => i.supplierId === vendor.id);
    const vendorId = vendor.id || vendorKey;
    const suffix = isDecorator ? `DEC-${vendorId.substring(0, 4).toUpperCase()}` : vendorId.substring(0, 4).toUpperCase();
    const poNumber = `${order?.orderNumber || projectId}-${suffix}`;
    return buildPurchaseOrderPdf({
      order,
      vendor,
      vendorItems: items,
      poNumber,
      artworkItems: getVendorArtworks(vendorKey),
      allArtworkCharges: data.allArtworkCharges || {},
      allItemCharges: data.allItemCharges || {},
      serviceCharges: data.serviceCharges || [],
      vendorIHD: getVendorDoc(vendorKey)?.metadata?.supplierIHD || null,
      vendorAddress: getVendorDefaultAddress(vendor.id),
      poType: isDecorator ? "decorator" : "supplier",
      sellerName: branding?.companyName ?? undefined,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderVendors, orderItems, order, data, branding]);

  const handleGeneratePO = async (vendorKey: string, vendorNameStr: string) => {
    const vendor = orderVendors.find((v) => (v.vendorKey || v.id) === vendorKey);
    const vendorId = vendor?.id || vendorKey;
    const isDecorator = vendor?.role === "decorator";

    if (!hasSupplierIHD && !isDecorator) {
      toast({ title: "Supplier In-Hands Date required", description: "Please set the default Supplier In-Hands Date above. You can override per vendor after generating.", variant: "destructive" });
      return;
    }
    if (!hasShippingAddress) {
      toast({ title: "Missing shipping address", description: "Please set a shipping address before generating POs.", variant: "destructive" });
      return;
    }
    const vendorShipping = getVendorShippingReady(vendorKey);
    if (!vendorShipping.ready && !isDecorator) {
      toast({
        title: "Incomplete shipping details",
        description: `${vendorShipping.configured}/${vendorShipping.total} products have shipping details. Configure all in the Shipping tab first.`,
        variant: "destructive",
      });
      return;
    }
    const pdfDoc = buildVendorPoDoc(vendorKey);
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
        itemsHash: vendorHashes[vendorKey],
      });
      const orderIHD = order?.supplierInHandsDate;
      if (newDoc?.id) {
        const meta: Record<string, unknown> = { ...(newDoc.metadata as Record<string, unknown> || {}), vendorKey, poType: isDecorator ? "decorator" : "supplier" };
        if (orderIHD && !isDecorator) {
          meta.supplierIHD = new Date(orderIHD as unknown as string).toISOString().split("T")[0];
        }
        await _updatePODocMeta.mutateAsync({
          docId: newDoc.id,
          updates: { metadata: meta },
        });
      }
      toast({ title: `PO PDF generated for ${vendorNameStr}` });
    } catch { /* handled */ }
  };

  const handleGenerateAllPOs = async () => {
    const targets = orderVendors.filter((v) => {
      const key = v.vendorKey || v.id;
      return !getVendorDoc(key);
    });
    if (targets.length === 0) {
      toast({ title: "All POs already generated" });
      return;
    }
    for (const vendor of targets) {
      await handleGeneratePO(vendor.vendorKey || vendor.id, vendor.name);
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
    const vendorName = orderVendors.find((v) => (v.vendorKey || v.id) === doc.vendorId)?.name || doc.vendorName || "";
    await handleGeneratePO(doc.vendorId || "", vendorName);
  };

  // Collect all sendable proofs across ALL vendors (for "Send All" button in header)
  const getAllSendableProofs = () => {
    const allProofs: VendorArtwork[] = [];
    for (const po of vendorPOs) {
      const vendorKey = po.vendor.vendorKey || po.vendor.id;
      const vendorItems = orderItems.filter((i) =>
        po.vendor.role === "decorator"
          ? i.decoratorType === "third_party" && i.decoratorId === po.vendor.id
          : i.supplierId === vendorKey,
      );
      vendorItems.forEach((item) => {
        const arts = allArtworkItems?.[item.id] || [];
        arts.forEach((art) => {
          const a = {
            ...art,
            productName: item.productName || "Unknown Product",
            orderItemId: item.id,
            supplierName: po.vendor.name || vendorKey,
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
    // Vendor addresses
    getVendorDefaultAddress,
  };
}
