import { useState, useMemo, useCallback, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { OrderItemLine } from "@shared/schema";
import { useDocumentGeneration, buildItemsHash } from "@/hooks/useDocumentGeneration";
import { useProductionStages } from "@/hooks/useProductionStages";
import { useInlineEdit } from "@/hooks/useInlineEdit";
import type { EmailFormData } from "@/components/email/types";
import type { PurchaseOrdersSectionProps, VendorPO } from "./types";
import { PO_STATUSES, PROOF_STATUSES } from "./types";

function getEditedItem(_id: string, item: any) {
  return {
    id: item.id, productId: item.productId, productName: item.productName,
    productSku: item.productSku, supplierId: item.supplierId,
    color: item.color || "", quantity: item.quantity || 0,
    unitPrice: parseFloat(item.unitPrice) || 0, cost: parseFloat(item.cost || 0),
    decorationCost: parseFloat(item.decorationCost || 0), charges: parseFloat(item.charges || 0),
    margin: 44, sizePricing: item.sizePricing || {},
  };
}

export function usePurchaseOrdersSection({ orderId, data, isLocked }: PurchaseOrdersSectionProps) {
  const { order, orderVendors, orderItems, allItemLines, allItemCharges, allArtworkItems, suppliers } = data;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { stages: productionStages } = useProductionStages();
  const { updateField, isPending: isFieldPending } = useInlineEdit({ orderId, isLocked });

  // Build a lookup map from stage ID → { label, color } for PO stage display
  const PO_STAGES: Record<string, { label: string; color: string }> = useMemo(() => {
    const map: Record<string, { label: string; color: string }> = {};
    for (const s of productionStages) {
      map[s.id] = { label: s.name, color: s.color };
    }
    return map;
  }, [productionStages]);
  const poRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const [expandedVendors, setExpandedVendors] = useState<Set<string>>(new Set());
  const [previewPO, setPreviewPO] = useState<VendorPO | null>(null);
  const [generatingVendorId, setGeneratingVendorId] = useState<string | null>(null);
  const [previewDocument, setPreviewDocument] = useState<any>(null);

  // Email PO to vendor
  const [emailPOVendor, setEmailPOVendor] = useState<{ doc: any; vendor: any } | null>(null);

  // Proofing states
  const [uploadProofArt, setUploadProofArt] = useState<any>(null);
  const [sendProofArts, setSendProofArts] = useState<any[]>([]);
  const [previewFile, setPreviewFile] = useState<{ url: string; name: string } | null>(null);

  // Fetch vendor contacts for PO email dialog
  const { data: poVendorContacts = [] } = useQuery<any[]>({
    queryKey: [`/api/contacts`, { supplierId: emailPOVendor?.vendor?.id }],
    queryFn: async () => {
      if (!emailPOVendor?.vendor?.id) return [];
      const response = await fetch(`/api/contacts?supplierId=${emailPOVendor.vendor.id}`, { credentials: "include" });
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!emailPOVendor?.vendor?.id,
  });

  const {
    poDocuments,
    isGenerating,
    generateDocument,
    deleteDocument,
    isDeleting,
  } = useDocumentGeneration(orderId);

  const toggleVendor = useCallback((vendorId: string) => {
    setExpandedVendors(prev => {
      const next = new Set(prev);
      if (next.has(vendorId)) next.delete(vendorId); else next.add(vendorId);
      return next;
    });
  }, []);

  // Build PO data per vendor
  const vendorPOs: VendorPO[] = useMemo(() => {
    return orderVendors.map((vendor: any) => {
      const items = orderItems.filter((item: any) => item.supplierId === vendor.id);
      const lines: Record<string, OrderItemLine[]> = {};
      let totalQty = 0;
      let totalCost = 0;

      items.forEach((item: any) => {
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

      return { vendor, items, lines, totalQty, totalCost };
    });
  }, [orderVendors, orderItems, allItemLines]);

  const grandTotalCost = vendorPOs.reduce((s, po) => s + po.totalCost, 0);
  const grandTotalQty = vendorPOs.reduce((s, po) => s + po.totalQty, 0);

  // Vendor PO hashes for stale detection
  const vendorHashes = useMemo(() => {
    const hashes: Record<string, string> = {};
    for (const vendor of orderVendors) {
      const vendorItems = orderItems.filter((i: any) => i.supplierId === vendor.id);
      hashes[vendor.id] = buildItemsHash(vendorItems, "po", order);
    }
    return hashes;
  }, [orderVendors, orderItems, order]);

  const getVendorDoc = (vendorId: string) => poDocuments.find((d: any) => d.vendorId === vendorId);

  const isVendorDocStale = (doc: any) => {
    if (!doc?.metadata?.itemsHash || !doc.vendorId) return false;
    return doc.metadata.itemsHash !== vendorHashes[doc.vendorId];
  };

  const getDocStage = (doc: any): string => doc?.metadata?.poStage || "created";
  const getDocStatus = (doc: any): string => doc?.metadata?.poStatus || "ok";

  // Get effective Supplier IHD: vendor-specific (from PO doc metadata) → order-level fallback
  const getVendorIHD = (vendorId: string): string | null => {
    const doc = getVendorDoc(vendorId);
    if (doc?.metadata?.supplierIHD) return doc.metadata.supplierIHD;
    return (order as any)?.supplierInHandsDate || null;
  };

  const hasShippingAddress = !!(order as any)?.shippingAddress ||
    !!((order as any)?.shippingCity && (order as any)?.shippingState);

  // Check if all vendor items have shipping details configured
  const getVendorShippingReady = (vendorId: string): { ready: boolean; configured: number; total: number } => {
    const items = orderItems.filter((i: any) => i.supplierId === vendorId);
    const configured = items.filter((i: any) => i.shippingDestination).length;
    return { ready: configured === items.length && items.length > 0, configured, total: items.length };
  };

  const allShippingConfigured = orderItems.length > 0 && orderItems.every((i: any) => i.shippingDestination);

  const hasSupplierIHD = !!(order as any)?.supplierInHandsDate;

  // Get vendor artworks for proofing
  const getVendorArtworks = (vendorId: string) => {
    const vendorItems = orderItems.filter((i: any) => i.supplierId === vendorId);
    const artworks: any[] = [];
    vendorItems.forEach((item: any) => {
      const arts = allArtworkItems?.[item.id] || [];
      arts.forEach((art: any) => {
        artworks.push({
          ...art,
          productName: item.productName || "Unknown Product",
          orderItemId: item.id,
          supplierName: vendorId,
        });
      });
    });
    return artworks;
  };

  // ── Mutations ──

  const handleGeneratePO = async (vendorId: string, vendorNameStr: string) => {
    if (!hasSupplierIHD) {
      toast({ title: "Supplier In-Hands Date required", description: "Please set the default Supplier In-Hands Date above. You can override per vendor after generating.", variant: "destructive" });
      return;
    }
    if (!hasShippingAddress) {
      toast({ title: "Missing shipping address", description: "Please set a shipping address before generating POs.", variant: "destructive" });
      return;
    }
    const vendorShipping = getVendorShippingReady(vendorId);
    if (!vendorShipping.ready) {
      toast({
        title: "Incomplete shipping details",
        description: `${vendorShipping.configured}/${vendorShipping.total} products have shipping details. Configure all in the Shipping tab first.`,
        variant: "destructive",
      });
      return;
    }
    const ref = poRefs.current[vendorId];
    if (!ref) return;
    const poNumber = `${(order as any)?.orderNumber || orderId}-${vendorId.substring(0, 4).toUpperCase()}`;
    setGeneratingVendorId(vendorId);
    try {
      const newDoc = await generateDocument({
        elementRef: ref,
        documentType: "purchase_order",
        documentNumber: poNumber,
        vendorId,
        vendorName: vendorNameStr,
        itemsHash: vendorHashes[vendorId],
      });
      // Auto-populate vendor IHD from order-level default
      const orderIHD = (order as any)?.supplierInHandsDate;
      if (newDoc?.id && orderIHD) {
        const rawDate = new Date(orderIHD).toISOString().split("T")[0];
        await updateDocMetaMutation.mutateAsync({
          docId: newDoc.id,
          updates: { metadata: { ...newDoc.metadata, supplierIHD: rawDate } },
        });
      }
      toast({ title: `PO PDF generated for ${vendorNameStr}` });
    } catch { /* handled */ } finally { setGeneratingVendorId(null); }
  };

  const handleRegeneratePO = async (doc: any) => {
    await deleteDocument(doc.id);
    await new Promise((r) => setTimeout(r, 300));
    await handleGeneratePO(doc.vendorId, doc.vendorName);
  };

  // Update PO document metadata (stage/status) with activity logging
  const updateDocMetaMutation = useMutation({
    mutationFn: async ({ docId, updates }: { docId: string; updates: Record<string, any> }) => {
      const res = await fetch(`/api/documents/${docId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update document");
      const result = await res.json();

      // Log activity for PO stage changes
      const newStage = updates.metadata?.poStage;
      if (newStage) {
        const stageLabel = PO_STAGES[newStage as keyof typeof PO_STAGES]?.label || newStage;
        const docNum = result.documentNumber || docId;
        try {
          await apiRequest("POST", `/api/projects/${orderId}/activities`, {
            activityType: "system_action",
            content: `PO #${docNum} stage changed to "${stageLabel}"`,
          });
        } catch { /* activity log is best-effort */ }
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}/documents`] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${orderId}/activities`] });
      // PO stage change may auto-transition SO status
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}`] });
    },
    onError: () => toast({ title: "Failed to update PO", variant: "destructive" }),
  });

  // Send PO email to vendor
  const sendPOEmailMutation = useMutation({
    mutationFn: async ({ doc, formData }: { doc: any; formData: EmailFormData & { adHocEmails: string[] } }) => {
      const emailBodyFull = doc.fileUrl
        ? `${formData.body}\n\n---\nView Purchase Order PDF: ${doc.fileUrl}`
        : formData.body;

      await apiRequest("POST", `/api/orders/${orderId}/communications`, {
        communicationType: "vendor_email",
        direction: "sent",
        recipientEmail: formData.to,
        recipientName: formData.toName,
        subject: formData.subject,
        body: emailBodyFull,
        cc: formData.cc || undefined,
        bcc: formData.bcc || undefined,
        metadata: { type: "purchase_order", documentId: doc.id, vendorId: doc.vendorId },
        autoAttachArtworkForVendor: doc.vendorId,
        autoAttachDocumentFile: doc.fileUrl ? { fileUrl: doc.fileUrl, fileName: doc.fileName || `PO-${doc.documentNumber}.pdf` } : undefined,
      });

      await updateDocMetaMutation.mutateAsync({
        docId: doc.id,
        updates: {
          status: "sent",
          sentAt: new Date().toISOString(),
          metadata: { ...doc.metadata, poStage: "submitted" },
        },
      });
    },
    onSuccess: () => {
      toast({ title: "PO sent to vendor!", description: "Email sent successfully." });
      setEmailPOVendor(null);
    },
    onError: () => toast({ title: "Failed to send PO", variant: "destructive" }),
  });

  // Update artwork (for proofing) with activity logging
  const updateArtworkMutation = useMutation({
    mutationFn: async ({ artworkId, orderItemId, updates }: { artworkId: string; orderItemId: string; updates: any }) => {
      const res = await fetch(`/api/order-items/${orderItemId}/artworks/${artworkId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update artwork");
      return res.json();
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}/all-artworks`] });
      // Log proofing status changes
      const newStatus = vars.updates.status;
      if (newStatus) {
        const statusLabel = PROOF_STATUSES[newStatus as keyof typeof PROOF_STATUSES]?.label || newStatus;
        const artName = vars.updates.name || "Artwork";
        apiRequest("POST", `/api/projects/${orderId}/activities`, {
          activityType: "system_action",
          content: `Proof status for "${artName}" changed to "${statusLabel}"`,
        }).catch(() => { /* best-effort */ });
        queryClient.invalidateQueries({ queryKey: [`/api/projects/${orderId}/activities`] });
      }
    },
    onError: () => toast({ title: "Failed to update artwork", variant: "destructive" }),
  });

  // Send batch proofs to client (one email with all approval links for a vendor)
  const sendBatchProofMutation = useMutation({
    mutationFn: async ({ artworks, formData }: { artworks: any[]; formData: EmailFormData & { adHocEmails: string[] } }) => {
      const approvalLinks: { art: any; url: string }[] = [];
      for (const art of artworks) {
        const approvalRes = await apiRequest("POST", `/api/orders/${orderId}/generate-approval`, {
          orderItemId: art.orderItemId, artworkItemId: art.id, clientEmail: formData.to, clientName: formData.toName,
        });
        const approval = await approvalRes.json();
        const approvalUrl = `${window.location.origin}/approval/${approval.approvalToken}`;
        approvalLinks.push({ art, url: approvalUrl });
      }

      const linksList = approvalLinks.map((link, idx) => {
        const art = link.art;
        return `${idx + 1}. ${art.productName} — ${art.location || art.artworkType || "Artwork"}\n   Review & Approve: ${link.url}`;
      }).join("\n\n");

      const emailBodyFull = `${formData.body}\n\n---\nArtwork Proofs for Approval:\n\n${linksList}`;

      await apiRequest("POST", `/api/orders/${orderId}/communications`, {
        communicationType: "client_email", direction: "sent",
        recipientEmail: formData.to, recipientName: formData.toName,
        subject: `Artwork Proofs for Approval - Order #${(order as any)?.orderNumber || ""} (${artworks.length} item${artworks.length > 1 ? "s" : ""})`,
        body: emailBodyFull,
        cc: formData.cc || undefined,
        bcc: formData.bcc || undefined,
        metadata: { type: "proof_approval_batch", artworkIds: artworks.map(a => a.id), approvalLinks: approvalLinks.map(l => l.url) },
      });

      return approvalLinks;
    },
    onSuccess: (approvalLinks) => {
      for (const link of approvalLinks) {
        updateArtworkMutation.mutate({
          artworkId: link.art.id, orderItemId: link.art.orderItemId,
          updates: { name: link.art.name, status: "pending_approval" },
        });
      }
      toast({ title: "Proofs sent to client!", description: `${approvalLinks.length} approval link${approvalLinks.length > 1 ? "s" : ""} sent.` });
      setSendProofArts([]);
    },
    onError: () => toast({ title: "Failed to send proofs", variant: "destructive" }),
  });

  // Helper: open email PO dialog
  const openEmailPO = (doc: any, vendor: any) => {
    setEmailPOVendor({ doc, vendor });
  };

  // Collect all sendable proofs across ALL vendors
  const getAllSendableProofs = () => {
    const allProofs: any[] = [];
    for (const po of vendorPOs) {
      const vendorArts = getVendorArtworks(po.vendor.id).filter(
        (a: any) => a.proofRequired !== false && a.proofFilePath && ["proof_received", "change_requested"].includes(a.status)
      );
      allProofs.push(...vendorArts);
    }
    return allProofs;
  };

  // Helper: open batch send proofs to client — works for single vendor or all vendors
  const openSendProofsDialog = (artworks: any[]) => {
    if (artworks.length === 0) {
      toast({ title: "No proofs ready to send", description: "Upload vendor proofs first.", variant: "destructive" });
      return;
    }
    setSendProofArts(artworks);
  };

  const openSendAllProofs = (vendorId: string) => {
    const vendorArts = getVendorArtworks(vendorId).filter(
      (a: any) => a.proofRequired !== false && a.proofFilePath && ["proof_received", "change_requested"].includes(a.status)
    );
    openSendProofsDialog(vendorArts);
  };

  const openSendAllVendorProofs = () => {
    openSendProofsDialog(getAllSendableProofs());
  };

  // Copy PO text
  const copyPOToClipboard = useCallback((po: VendorPO) => {
    const lns: string[] = [`PURCHASE ORDER`, `Order: ${(order as any)?.orderNumber || orderId}`, `Vendor: ${po.vendor.name}`];
    if (po.vendor.email) lns.push(`Email: ${po.vendor.email}`);
    lns.push(`Date: ${new Date().toLocaleDateString()}`, `${"─".repeat(50)}`);
    po.items.forEach((item: any) => {
      lns.push(`\n${item.productName || "Product"} (${item.productSku || "No SKU"})`);
      const itemLines = po.lines[item.id] || [];
      if (itemLines.length > 0) {
        itemLines.forEach((l) => {
          const qty = l.quantity || 0;
          const cost = parseFloat(l.cost || "0");
          lns.push(`  ${(l.color || "--").padEnd(11)}${(l.size || "--").padEnd(11)}${String(qty).padEnd(7)}$${cost.toFixed(2).padEnd(11)}$${(qty * cost).toFixed(2)}`);
        });
      } else {
        const qty = item.quantity || 0;
        const cost = parseFloat(item.cost || item.unitPrice || "0");
        lns.push(`  Qty: ${qty}  |  Cost: $${cost.toFixed(2)}  |  Total: $${(qty * cost).toFixed(2)}`);
      }
    });
    lns.push(`\n${"─".repeat(50)}`, `TOTAL: ${po.totalQty} units  |  $${po.totalCost.toFixed(2)}`);
    navigator.clipboard.writeText(lns.join("\n")).then(() => toast({ title: "PO copied to clipboard" }));
  }, [order, orderId, toast]);

  // Handle proof upload from file picker
  const handleProofUploaded = (files: any[]) => {
    const file = files[0];
    if (file && uploadProofArt) {
      updateArtworkMutation.mutate({
        artworkId: uploadProofArt.id, orderItemId: uploadProofArt.orderItemId,
        updates: {
          name: uploadProofArt.name, status: "proof_received",
          proofFilePath: file.cloudinaryUrl,
          proofFileName: file.originalName || file.fileName,
        },
      });
      toast({ title: "Vendor proof uploaded", description: "Status updated to Proof Received" });
    }
    setUploadProofArt(null);
  };

  return {
    // Data
    order,
    orderVendors,
    orderItems,
    allItemLines,
    allItemCharges,
    allArtworkItems,
    suppliers,
    data,
    isLocked,
    orderId,
    // Production stages
    PO_STAGES,
    PO_STATUSES,
    PROOF_STATUSES,
    poRefs,
    // Vendors
    vendorPOs,
    grandTotalCost,
    grandTotalQty,
    expandedVendors,
    toggleVendor,
    // Documents
    poDocuments,
    isGenerating,
    generatingVendorId,
    previewDocument,
    setPreviewDocument,
    previewPO,
    setPreviewPO,
    getVendorDoc,
    isVendorDocStale,
    getDocStage,
    getDocStatus,
    vendorHashes,
    handleGeneratePO,
    handleRegeneratePO,
    updateDocMetaMutation,
    deleteDocument,
    isDeleting,
    getEditedItem,
    // Shipping
    hasShippingAddress,
    allShippingConfigured,
    hasSupplierIHD,
    getVendorShippingReady,
    getVendorIHD,
    // Inline edit
    updateField,
    isFieldPending,
    // Email
    emailPOVendor,
    setEmailPOVendor,
    poVendorContacts,
    openEmailPO,
    sendPOEmailMutation,
    // Proofing
    uploadProofArt,
    setUploadProofArt,
    sendProofArts,
    setSendProofArts,
    previewFile,
    setPreviewFile,
    updateArtworkMutation,
    sendBatchProofMutation,
    getVendorArtworks,
    getAllSendableProofs,
    openSendAllProofs,
    openSendAllVendorProofs,
    handleProofUploaded,
    // Clipboard
    copyPOToClipboard,
  };
}
