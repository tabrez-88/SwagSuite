import { useState, useMemo, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useInlineEdit } from "@/hooks/useInlineEdit";
import { hasTimelineConflict } from "@/lib/dateUtils";
import { useDocumentGeneration, buildItemsHash } from "@/hooks/useDocumentGeneration";
import type { SalesOrderSectionProps } from "./types";
import { salesOrderStatuses, proofStatuses } from "./types";

function getEditedItem(_id: string, item: any) {
  return {
    id: item.id,
    productId: item.productId,
    productName: item.productName,
    productSku: item.productSku,
    supplierId: item.supplierId,
    color: item.color || "",
    quantity: item.quantity || 0,
    unitPrice: parseFloat(item.unitPrice) || 0,
    cost: parseFloat(item.cost || 0),
    decorationCost: parseFloat(item.decorationCost || 0),
    charges: parseFloat(item.charges || 0),
    margin: 44,
    sizePricing: item.sizePricing || {},
  };
}

export function useSalesOrderSection({ orderId, data, lockStatus }: SalesOrderSectionProps) {
  const { order, orderItems, companyName, primaryContact, contacts, allArtworkItems } = data;
  const [, setLocation] = useLocation();
  const [isInfoCollapsed, setIsInfoCollapsed] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<any>(null);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const soRef = useRef<HTMLDivElement>(null);

  const {
    soDocuments,
    quoteApprovals,
    isGenerating,
    generateDocument,
    deleteDocument,
    createQuoteApproval,
    isDeleting,
  } = useDocumentGeneration(orderId);

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      await apiRequest("PATCH", `/api/orders/${orderId}`, {
        salesOrderStatus: newStatus,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}`] });
    },
    onError: () => {
      toast({ title: "Failed to update status", variant: "destructive" });
    },
  });

  const duplicateOrderMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/orders/${orderId}/duplicate`);
      return res;
    },
    onSuccess: (data: any) => {
      toast({ title: "Order duplicated!", description: `New order #${data.order?.orderNumber} created` });
      setLocation(`/project/${data.order?.id}`);
    },
    onError: () => {
      toast({ title: "Failed to duplicate order", variant: "destructive" });
    },
  });

  // SO document generation
  const currentSOHash = useMemo(() => {
    return buildItemsHash(orderItems, "sales_order", order);
  }, [orderItems, order]);

  const isSOStale = (doc: any) => {
    const storedHash = doc.metadata?.itemsHash;
    if (!storedHash) return false;
    return storedHash !== currentSOHash;
  };

  const handleGenerateSO = async () => {
    if (!soRef.current || orderItems.length === 0) return;
    try {
      await generateDocument({
        elementRef: soRef.current,
        documentType: "sales_order",
        documentNumber: (order as any)?.orderNumber || "DRAFT",
        itemsHash: currentSOHash,
      });
      toast({ title: "Sales Order PDF generated successfully" });
    } catch {
      // Error handled by hook
    }
  };

  const handleRegenerateSO = async (docId: string) => {
    await deleteDocument(docId);
    await new Promise((r) => setTimeout(r, 300));
    await handleGenerateSO();
  };

  const handleGetApprovalLink = async (doc: any) => {
    const existingApproval = quoteApprovals.find((a: any) => a.status === "pending");
    if (existingApproval) {
      const approvalUrl = `${window.location.origin}/client-approval/${existingApproval.approvalToken}`;
      navigator.clipboard.writeText(approvalUrl);
      toast({ title: "Approval Link Copied", description: "The existing approval link has been copied to clipboard." });
      return;
    }
    try {
      const result = await createQuoteApproval({
        clientEmail: primaryContact?.email || "",
        clientName: primaryContact ? `${primaryContact.firstName} ${primaryContact.lastName}` : companyName,
        documentId: doc.id,
        pdfPath: doc.fileUrl,
        quoteTotal: (order as any)?.total,
      });
      const approvalUrl = `${window.location.origin}/client-approval/${result.approvalToken}`;
      navigator.clipboard.writeText(approvalUrl);
      toast({ title: "Approval Link Generated", description: "Link copied to clipboard." });
    } catch {
      toast({ title: "Error", description: "Failed to generate approval link", variant: "destructive" });
    }
  };

  const handleDuplicate = () => {
    if (!confirm("Duplicate this order? A new project will be created with all items and settings copied.")) return;
    duplicateOrderMutation.mutate();
  };

  const currentStatus = (order as any)?.salesOrderStatus || "new";
  const statusInfo = salesOrderStatuses.find((s) => s.value === currentStatus) || salesOrderStatuses[0];

  const isLocked = lockStatus?.isLocked ?? false;
  const { updateField, isPending: isFieldPending } = useInlineEdit({ orderId, isLocked });
  const timelineConflicts = hasTimelineConflict(order);

  // Artwork sub-component state
  const [previewFile, setPreviewFile] = useState<{ url: string; name: string } | null>(null);

  const artworks: any[] = useMemo(() => {
    const result: any[] = [];
    if (allArtworkItems && typeof allArtworkItems === "object") {
      Object.entries(allArtworkItems).forEach(([itemId, arts]: [string, any[]]) => {
        const item = orderItems.find((i: any) => i.id === itemId);
        const supplier = item?.supplierId ? data.suppliers?.find((s: any) => s.id === item.supplierId) : null;
        arts.forEach((art: any) => {
          result.push({
            ...art,
            productName: item?.productName || "Unknown Product",
            productSku: item?.productSku || "",
            supplierName: supplier?.name || item?.supplierName || "Unknown Vendor",
          });
        });
      });
    }
    return result;
  }, [allArtworkItems, orderItems, data.suppliers]);

  const artworkStatusCounts = useMemo(() => {
    return artworks.reduce((acc: Record<string, number>, art) => {
      const s = art.status || "pending";
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {});
  }, [artworks]);

  const soTotal = useMemo(() => {
    return orderItems.reduce((sum: number, item: any) => sum + (parseFloat(item.unitPrice) || 0) * (item.quantity || 0), 0);
  }, [orderItems]);

  const contactsList = useMemo(() => {
    return (contacts || []).map((c: any) => ({
      id: String(c.id),
      firstName: c.firstName || "",
      lastName: c.lastName || "",
      email: c.email,
      isPrimary: c.isPrimary,
      title: c.title,
      receiveOrderEmails: c.receiveOrderEmails,
    }));
  }, [contacts]);

  return {
    // Data
    order,
    orderItems,
    companyName,
    primaryContact,
    allArtworkItems,
    soDocuments,
    quoteApprovals,
    currentStatus,
    statusInfo,
    isLocked,
    timelineConflicts,
    previewDocument,
    showSendDialog,
    isInfoCollapsed,
    soRef,
    isFieldPending,
    contactsList,
    soTotal,
    data,

    // Artwork
    artworks,
    artworkStatusCounts,
    previewFile,
    setPreviewFile,

    // Loading/pending states
    isGenerating,
    isDeleting,
    isDuplicating: duplicateOrderMutation.isPending,

    // Actions
    updateStatusMutation,
    updateField,
    setIsInfoCollapsed,
    setPreviewDocument,
    setShowSendDialog,
    handleGenerateSO,
    handleRegenerateSO,
    handleGetApprovalLink,
    handleDuplicate,
    deleteDocument,
    getEditedItem,

    // For stale detection
    currentSOHash,
    isSOStale,

    // Constants (re-exported for JSX)
    salesOrderStatuses,
    proofStatuses,

    // For SendSODialog
    createQuoteApproval,
  };
}
