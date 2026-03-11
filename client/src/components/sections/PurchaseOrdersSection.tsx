import { useState, useMemo, useCallback, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle, Building2, CheckCircle, ChevronDown, ChevronRight,
  ClipboardList, Copy, Download, Eye, FileText, Loader2,
  Mail, MoreHorizontal, Package, Palette, Printer, Send, Upload,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { ProjectData } from "@/types/project-types";
import type { OrderItemLine } from "@shared/schema";
import { useDocumentGeneration, buildItemsHash } from "@/hooks/useDocumentGeneration";
import PurchaseOrderTemplate from "@/components/documents/PurchaseOrderTemplate";
import GeneratedDocumentCard from "@/components/documents/GeneratedDocumentCard";
import { DocumentEditor } from "@/components/DocumentEditor";
import FilePickerDialog from "@/components/modals/FilePickerDialog";
import { FilePreviewModal } from "@/components/modals/FilePreviewModal";

interface PurchaseOrdersSectionProps {
  orderId: string;
  data: ProjectData;
  isLocked?: boolean;
}

interface VendorPO {
  vendor: any;
  items: any[];
  lines: Record<string, OrderItemLine[]>;
  totalQty: number;
  totalCost: number;
}

// CommonSKU PO Stages
const PO_STAGES: Record<string, { label: string; color: string }> = {
  created: { label: "Created", color: "bg-gray-100 text-gray-700" },
  submitted: { label: "Submitted", color: "bg-blue-100 text-blue-800" },
  confirmed: { label: "Confirmed", color: "bg-green-100 text-green-800" },
  shipped: { label: "Shipped", color: "bg-indigo-100 text-indigo-800" },
  ready_for_billing: { label: "Ready for Billing", color: "bg-teal-100 text-teal-800" },
  billed: { label: "Billed", color: "bg-purple-100 text-purple-800" },
  closed: { label: "Closed", color: "bg-red-100 text-red-800" },
};

// PO Status (urgency)
const PO_STATUSES: Record<string, { label: string; color: string }> = {
  ok: { label: "OK", color: "bg-green-100 text-green-700" },
  follow_up: { label: "Follow Up", color: "bg-yellow-100 text-yellow-800" },
  problem: { label: "Problem", color: "bg-red-100 text-red-800" },
};

// Proof statuses (CommonSKU flow)
const PROOF_STATUSES: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-gray-100 text-gray-700" },
  awaiting_proof: { label: "Awaiting Proof", color: "bg-yellow-100 text-yellow-800" },
  proof_received: { label: "Proof Received", color: "bg-blue-100 text-blue-800" },
  pending_approval: { label: "Pending Approval", color: "bg-orange-100 text-orange-800" },
  approved: { label: "Approved", color: "bg-green-100 text-green-800" },
  change_requested: { label: "Change Requested", color: "bg-red-100 text-red-800" },
  proofing_complete: { label: "Proofing Complete", color: "bg-teal-100 text-teal-800" },
};

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

export default function PurchaseOrdersSection({ orderId, data, isLocked }: PurchaseOrdersSectionProps) {
  const { order, orderVendors, orderItems, allItemLines, allItemCharges, allArtworkItems, suppliers } = data;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const poRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const [expandedVendors, setExpandedVendors] = useState<Set<string>>(new Set());
  const [previewPO, setPreviewPO] = useState<VendorPO | null>(null);
  const [generatingVendorId, setGeneratingVendorId] = useState<string | null>(null);
  const [previewDocument, setPreviewDocument] = useState<any>(null);

  // Email PO to vendor
  const [emailPOVendor, setEmailPOVendor] = useState<{ doc: any; vendor: any } | null>(null);
  const [vendorEmail, setVendorEmail] = useState("");
  const [vendorName, setVendorName] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");

  // Proofing states
  const [uploadProofArt, setUploadProofArt] = useState<any>(null);
  const [sendProofArt, setSendProofArt] = useState<any>(null);
  const [clientEmail, setClientEmail] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientMessage, setClientMessage] = useState("");
  const [previewFile, setPreviewFile] = useState<{ url: string; name: string } | null>(null);

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

  const hasShippingAddress = !!(order as any)?.shippingAddress ||
    !!((order as any)?.shippingCity && (order as any)?.shippingState);

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
    if (!hasShippingAddress) {
      toast({ title: "Missing shipping address", description: "Please set a shipping address before generating POs.", variant: "destructive" });
      return;
    }
    const ref = poRefs.current[vendorId];
    if (!ref) return;
    const poNumber = `${(order as any)?.orderNumber || orderId}-${vendorId.substring(0, 4).toUpperCase()}`;
    setGeneratingVendorId(vendorId);
    try {
      await generateDocument({
        elementRef: ref,
        documentType: "purchase_order",
        documentNumber: poNumber,
        vendorId,
        vendorName: vendorNameStr,
        itemsHash: vendorHashes[vendorId],
      });
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
    mutationFn: async ({ doc, email, name, subject, body }: { doc: any; email: string; name: string; subject: string; body: string }) => {
      // Send email via communications
      const emailBodyFull = doc.fileUrl
        ? `${body}\n\n---\nView Purchase Order PDF: ${doc.fileUrl}`
        : body;

      await apiRequest("POST", `/api/orders/${orderId}/communications`, {
        communicationType: "vendor_email",
        direction: "sent",
        recipientEmail: email,
        recipientName: name,
        subject,
        body: emailBodyFull,
        metadata: { type: "purchase_order", documentId: doc.id, vendorId: doc.vendorId },
        autoAttachArtworkForVendor: doc.vendorId,
        autoAttachDocumentFile: doc.fileUrl ? { fileUrl: doc.fileUrl, fileName: doc.fileName || `PO-${doc.documentNumber}.pdf` } : undefined,
      });

      // Update PO stage to "submitted" and mark sentAt
      await updateDocMetaMutation.mutateAsync({
        docId: doc.id,
        updates: {
          status: "sent",
          sentAt: new Date().toISOString(),
          metadata: { ...doc.metadata, poStage: "submitted" },
        },
      });
    },
    onSuccess: (_data, vars) => {
      toast({ title: "PO sent to vendor!", description: `Email sent to ${vars.email}` });
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

  // Send proof to client
  const sendClientProofMutation = useMutation({
    mutationFn: async ({ art, email, name, message }: { art: any; email: string; name: string; message: string }) => {
      const approvalRes = await apiRequest("POST", `/api/orders/${orderId}/generate-approval`, {
        orderItemId: art.orderItemId, artworkFileId: null, clientEmail: email, clientName: name,
      });
      const approval = await approvalRes.json();
      const approvalUrl = `${window.location.origin}/approval/${approval.approvalToken}`;
      const emailBodyFull = `${message}\n\n---\nView & Approve Artwork Proof: ${approvalUrl}`;
      await apiRequest("POST", `/api/orders/${orderId}/communications`, {
        communicationType: "client_email", direction: "sent",
        recipientEmail: email, recipientName: name,
        subject: `Artwork Proof for Approval - Order #${(order as any)?.orderNumber || ""}`,
        body: emailBodyFull,
        metadata: { type: "proof_approval", artworkId: art.id, approvalUrl },
      });
    },
    onSuccess: (_data, vars) => {
      updateArtworkMutation.mutate({
        artworkId: vars.art.id, orderItemId: vars.art.orderItemId,
        updates: { name: vars.art.name, status: "pending_approval" },
      });
      toast({ title: "Proof sent to client!", description: `Approval link sent to ${vars.email}` });
      setSendProofArt(null);
    },
    onError: () => toast({ title: "Failed to send proof", variant: "destructive" }),
  });

  // Helper: open email PO dialog
  const openEmailPO = (doc: any, vendor: any) => {
    setVendorEmail(vendor.email || "");
    setVendorName(vendor.contactPerson || vendor.name || "");
    setEmailSubject(`Purchase Order #${doc.documentNumber} - ${(order as any)?.orderNumber || ""}`);
    setEmailBody(`Hi ${vendor.contactPerson || vendor.name || "there"},\n\nPlease find the attached purchase order for your review and confirmation.\n\nOrder #: ${(order as any)?.orderNumber || ""}\nPO #: ${doc.documentNumber}\n${(order as any)?.supplierInHandsDate ? `In-Hands Date: ${new Date((order as any).supplierInHandsDate).toLocaleDateString()}` : ""}\n\nPlease confirm receipt and acknowledge this order.\n\nThank you.`);
    setEmailPOVendor({ doc, vendor });
  };

  // Helper: open send proof to client
  const openSendProof = (art: any) => {
    const pc = (data as any).primaryContact;
    const cn = (data as any).companyName || "";
    setClientEmail(pc?.email || "");
    setClientName(pc ? `${pc.firstName} ${pc.lastName}` : cn);
    setClientMessage(`Hi ${pc?.firstName || "there"},\n\nWe've received the artwork proof for your order. Please review and let us know if you'd like to approve or request changes.\n\nProduct: ${art.productName}\nDecoration: ${art.location || "N/A"}\n\nBest regards,\n${cn}`);
    setSendProofArt(art);
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

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <ClipboardList className="w-5 h-5" /> Purchase Orders
          </h2>
          <Badge variant="secondary" className="text-xs">
            {vendorPOs.length} vendor{vendorPOs.length !== 1 ? "s" : ""}
          </Badge>
        </div>
      </div>

      {/* Shipping Address Warning */}
      {!hasShippingAddress && orderItems.length > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>No shipping address set. POs require a ship-to address — set it in the Sales Order section.</span>
        </div>
      )}

      {/* Empty state */}
      {vendorPOs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ClipboardList className="w-14 h-14 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium mb-1">No vendors on this order</p>
            <p className="text-xs text-gray-400">Add products with vendor/supplier info to generate POs</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {vendorPOs.map((po) => {
            const isExpanded = expandedVendors.has(po.vendor.id);
            const vendorDoc = getVendorDoc(po.vendor.id);
            const isVendorGenerating = generatingVendorId === po.vendor.id;
            const poStage = vendorDoc ? getDocStage(vendorDoc) : null;
            const poStatus = vendorDoc ? getDocStatus(vendorDoc) : null;
            const stageInfo = poStage ? PO_STAGES[poStage] || PO_STAGES.created : null;
            const statusInfo = poStatus ? PO_STATUSES[poStatus] || PO_STATUSES.ok : null;
            const vendorArtworks = getVendorArtworks(po.vendor.id);

            return (
              <Card key={po.vendor.id} className="overflow-hidden">
                {/* Vendor header row */}
                <div className="p-4 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => toggleVendor(po.vendor.id)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                      <Building2 className="w-5 h-5 text-blue-500" />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-sm">{po.vendor.name}</h3>
                          {stageInfo && <Badge variant="outline" className={`text-[10px] ${stageInfo.color}`}>{stageInfo.label}</Badge>}
                          {statusInfo && poStatus !== "ok" && <Badge variant="outline" className={`text-[10px] ${statusInfo.color}`}>{statusInfo.label}</Badge>}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          {po.vendor.contactPerson && <span>Attn: {po.vendor.contactPerson}</span>}
                          {po.vendor.email && <span>{po.vendor.email}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-center">
                        <p className="text-[10px] text-gray-400 uppercase">Items</p>
                        <p className="font-semibold">{po.items.length}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-gray-400 uppercase">Qty</p>
                        <p className="font-semibold">{po.totalQty}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-gray-400 uppercase">Cost</p>
                        <p className="font-semibold text-blue-600">${po.totalCost.toFixed(2)}</p>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        {!vendorDoc ? (
                          <Button variant="default" size="sm" className="h-7 text-xs gap-1"
                            onClick={() => handleGeneratePO(po.vendor.id, po.vendor.name)}
                            disabled={isVendorGenerating || isGenerating || isLocked}>
                            {isVendorGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />}
                            Generate PO
                          </Button>
                        ) : (
                          <>
                            {/* Email to Vendor */}
                            {poStage === "created" && (
                              <Button variant="default" size="sm" className="h-7 text-xs gap-1"
                                onClick={() => openEmailPO(vendorDoc, po.vendor)} disabled={isLocked}>
                                <Mail className="w-3 h-3" /> Email to Vendor
                              </Button>
                            )}
                            {/* More Actions Dropdown */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="h-7 w-7 p-0">
                                  <MoreHorizontal className="w-3 h-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {poStage !== "created" && (
                                  <DropdownMenuItem onClick={() => openEmailPO(vendorDoc, po.vendor)}>
                                    <Mail className="w-4 h-4 mr-2" /> Resend PO Email
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => setPreviewDocument(vendorDoc)}>
                                  <Eye className="w-4 h-4 mr-2" /> Preview PDF
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                  if (vendorDoc.fileUrl) {
                                    const link = document.createElement("a");
                                    link.href = vendorDoc.fileUrl; link.download = vendorDoc.fileName;
                                    link.target = "_blank"; document.body.appendChild(link);
                                    link.click(); document.body.removeChild(link);
                                  }
                                }}>
                                  <Download className="w-4 h-4 mr-2" /> Download PDF
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setPreviewPO(po)}>
                                  <FileText className="w-4 h-4 mr-2" /> Quick Preview
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => copyPOToClipboard(po)}>
                                  <Copy className="w-4 h-4 mr-2" /> Copy to Clipboard
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {/* Stage changes */}
                                {poStage === "submitted" && (
                                  <DropdownMenuItem onClick={() => updateDocMetaMutation.mutate({
                                    docId: vendorDoc.id,
                                    updates: { metadata: { ...vendorDoc.metadata, poStage: "confirmed" } },
                                  })}>
                                    <CheckCircle className="w-4 h-4 mr-2" /> Mark as Confirmed
                                  </DropdownMenuItem>
                                )}
                                {poStage === "confirmed" && (
                                  <DropdownMenuItem onClick={() => updateDocMetaMutation.mutate({
                                    docId: vendorDoc.id,
                                    updates: { metadata: { ...vendorDoc.metadata, poStage: "shipped" } },
                                  })}>
                                    <Package className="w-4 h-4 mr-2" /> Mark as Shipped
                                  </DropdownMenuItem>
                                )}
                                {poStage === "shipped" && (
                                  <DropdownMenuItem onClick={() => updateDocMetaMutation.mutate({
                                    docId: vendorDoc.id,
                                    updates: { metadata: { ...vendorDoc.metadata, poStage: "ready_for_billing" } },
                                  })}>
                                    <ClipboardList className="w-4 h-4 mr-2" /> Ready for Billing
                                  </DropdownMenuItem>
                                )}
                                {poStage === "ready_for_billing" && (
                                  <DropdownMenuItem onClick={() => updateDocMetaMutation.mutate({
                                    docId: vendorDoc.id,
                                    updates: { metadata: { ...vendorDoc.metadata, poStage: "billed" } },
                                  })}>
                                    <FileText className="w-4 h-4 mr-2" /> Mark as Billed
                                  </DropdownMenuItem>
                                )}
                                {poStage === "billed" && (
                                  <DropdownMenuItem onClick={() => updateDocMetaMutation.mutate({
                                    docId: vendorDoc.id,
                                    updates: { metadata: { ...vendorDoc.metadata, poStage: "closed" } },
                                  })}>
                                    <CheckCircle className="w-4 h-4 mr-2" /> Close PO
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded — items + proofing */}
                {isExpanded && (
                  <div className="border-t">
                    {/* Items List */}
                    <div className="bg-gray-50/50">
                      {po.items.map((item: any, idx: number) => {
                        const itemLines = po.lines[item.id] || [];
                        return (
                          <div key={item.id} className={`px-6 py-3 ${idx < po.items.length - 1 ? "border-b" : ""}`}>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Package className="w-4 h-4 text-gray-400" />
                                <span className="text-sm font-medium">{item.productName || "Product"}</span>
                                <span className="text-xs text-blue-600">{item.productSku || ""}</span>
                              </div>
                            </div>
                            {itemLines.length > 0 ? (
                              <div className="border rounded bg-white overflow-hidden">
                                <table className="w-full text-xs">
                                  <thead className="bg-gray-50 border-b">
                                    <tr>
                                      <th className="text-left p-2 font-medium">Color</th>
                                      <th className="text-left p-2 font-medium">Size</th>
                                      <th className="text-right p-2 font-medium">Qty</th>
                                      <th className="text-right p-2 font-medium">Cost</th>
                                      <th className="text-right p-2 font-medium">Ext. Cost</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {itemLines.map((l) => {
                                      const qty = l.quantity || 0;
                                      const cost = parseFloat(l.cost || "0");
                                      return (
                                        <tr key={l.id} className="border-b last:border-0">
                                          <td className="p-2">{l.color || "--"}</td>
                                          <td className="p-2">{l.size || "--"}</td>
                                          <td className="p-2 text-right font-medium">{qty}</td>
                                          <td className="p-2 text-right">${cost.toFixed(2)}</td>
                                          <td className="p-2 text-right font-medium">${(qty * cost).toFixed(2)}</td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <div className="text-xs text-gray-500 flex gap-4 ml-6">
                                <span>Qty: <strong>{item.quantity}</strong></span>
                                <span>Cost: <strong>${parseFloat(item.cost || item.unitPrice || "0").toFixed(2)}</strong></span>
                                {item.color && <span>Color: {item.color}</span>}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Proofing Section (per vendor PO) */}
                    {vendorDoc && vendorArtworks.length > 0 && (
                      <div className="border-t p-4">
                        <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
                          <Palette className="w-4 h-4 text-gray-400" />
                          Proofs
                        </h4>
                        <div className="space-y-2">
                          {vendorArtworks.map((art: any) => {
                            const si = PROOF_STATUSES[art.status] || PROOF_STATUSES.pending;
                            const canUpload = ["awaiting_proof", "change_requested"].includes(art.status);
                            const canSendClient = ["proof_received", "change_requested"].includes(art.status);
                            const canMarkComplete = art.status === "approved";

                            return (
                              <div key={art.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg border">
                                <div className="w-10 h-10 flex-shrink-0 bg-white rounded border overflow-hidden flex items-center justify-center cursor-pointer"
                                  onClick={() => { const url = art.fileUrl || art.filePath; if (url) setPreviewFile({ url, name: art.name || "Artwork" }); }}>
                                  {art.fileUrl || art.filePath ? (
                                    <img src={art.fileUrl || art.filePath} alt="" className="w-full h-full object-contain p-0.5" />
                                  ) : (
                                    <Palette className="w-4 h-4 text-gray-300" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium truncate">{art.name || art.fileName}</p>
                                  <p className="text-[10px] text-gray-400">{art.productName} {art.location ? `· ${art.location}` : ""}</p>
                                </div>
                                <Badge variant="outline" className={`text-[10px] ${si.color}`}>{si.label}</Badge>

                                {/* Proof actions */}
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                      <MoreHorizontal className="w-3 h-3" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    {["pending", "change_requested"].includes(art.status || "pending") && (
                                      <DropdownMenuItem onClick={() => {
                                        updateArtworkMutation.mutate({
                                          artworkId: art.id, orderItemId: art.orderItemId,
                                          updates: { name: art.name, status: "awaiting_proof" },
                                        });
                                        toast({ title: "Status set to Awaiting Proof" });
                                      }}>
                                        <Mail className="w-4 h-4 mr-2" /> Mark Awaiting Proof
                                      </DropdownMenuItem>
                                    )}
                                    {canUpload && (
                                      <DropdownMenuItem onClick={() => setUploadProofArt(art)}>
                                        <Upload className="w-4 h-4 mr-2" /> Upload Vendor Proof
                                      </DropdownMenuItem>
                                    )}
                                    {canSendClient && (
                                      <DropdownMenuItem onClick={() => openSendProof(art)}>
                                        <Send className="w-4 h-4 mr-2" /> Send Proof to Client
                                      </DropdownMenuItem>
                                    )}
                                    {canMarkComplete && (
                                      <DropdownMenuItem onClick={() => {
                                        updateArtworkMutation.mutate({
                                          artworkId: art.id, orderItemId: art.orderItemId,
                                          updates: { name: art.name, status: "proofing_complete" },
                                        });
                                        toast({ title: "Proofing marked as complete" });
                                      }}>
                                        <CheckCircle className="w-4 h-4 mr-2" /> Mark Proofing Complete
                                      </DropdownMenuItem>
                                    )}
                                    {art.proofFilePath && (
                                      <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => setPreviewFile({ url: art.proofFilePath, name: art.proofFileName || "Vendor Proof" })}>
                                          <Eye className="w-4 h-4 mr-2" /> View Vendor Proof
                                        </DropdownMenuItem>
                                      </>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* PO Stage selector (when doc exists) */}
                    {vendorDoc && (
                      <div className="border-t p-4 flex items-center gap-4">
                        <div>
                          <label className="text-[10px] font-medium text-gray-500 block mb-1">PO Stage</label>
                          <Select
                            value={getDocStage(vendorDoc)}
                            onValueChange={(val) => updateDocMetaMutation.mutate({
                              docId: vendorDoc.id,
                              updates: { metadata: { ...vendorDoc.metadata, poStage: val } },
                            })}
                            disabled={isLocked}
                          >
                            <SelectTrigger className="h-8 text-xs w-[180px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(PO_STAGES).map(([key, val]) => (
                                <SelectItem key={key} value={key}>
                                  <span className="flex items-center gap-2">
                                    <span className={`inline-block w-2 h-2 rounded-full ${val.color.split(" ")[0]}`} />
                                    {val.label}
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-[10px] font-medium text-gray-500 block mb-1">PO Status</label>
                          <Select
                            value={getDocStatus(vendorDoc)}
                            onValueChange={(val) => updateDocMetaMutation.mutate({
                              docId: vendorDoc.id,
                              updates: { metadata: { ...vendorDoc.metadata, poStatus: val } },
                            })}
                            disabled={isLocked}
                          >
                            <SelectTrigger className="h-8 text-xs w-[150px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(PO_STATUSES).map(([key, val]) => (
                                <SelectItem key={key} value={key}>
                                  <span className="flex items-center gap-2">
                                    <span className={`inline-block w-2 h-2 rounded-full ${val.color.split(" ")[0]}`} />
                                    {val.label}
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}

          {/* Grand totals */}
          <Card className="bg-purple-50/60">
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-5">
                  <div>
                    <span className="text-gray-500 text-xs">Vendors</span>
                    <p className="font-semibold">{vendorPOs.length}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs">Total Qty</span>
                    <p className="font-semibold">{grandTotalQty}</p>
                  </div>
                  {(order as any)?.inHandsDate && (
                    <div>
                      <span className="text-gray-500 text-xs">In-Hands Date</span>
                      <p className="font-semibold">{new Date((order as any).inHandsDate).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-500">Total PO Cost</span>
                  <p className="text-lg font-bold text-purple-700">${grandTotalCost.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Hidden PO templates for PDF generation */}
      {vendorPOs.map((po) => {
        const poNumber = `${(order as any)?.orderNumber || orderId}-${po.vendor.id.substring(0, 4).toUpperCase()}`;
        return (
          <PurchaseOrderTemplate
            key={po.vendor.id}
            ref={(el) => { poRefs.current[po.vendor.id] = el; }}
            order={order}
            vendor={po.vendor}
            vendorItems={po.items}
            poNumber={poNumber}
            artworkItems={getVendorArtworks(po.vendor.id)}
          />
        );
      })}

      {/* ── Email PO to Vendor Dialog ── */}
      <Dialog open={!!emailPOVendor} onOpenChange={(open) => !open && setEmailPOVendor(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" /> Email PO to Vendor
            </DialogTitle>
            <DialogDescription>
              Send PO #{emailPOVendor?.doc.documentNumber} to {emailPOVendor?.vendor.name}. The PO PDF link will be included.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Vendor Email</label>
                <Input value={vendorEmail} onChange={(e) => setVendorEmail(e.target.value)} placeholder="vendor@example.com" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Contact Name</label>
                <Input value={vendorName} onChange={(e) => setVendorName(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Subject</label>
              <Input value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Message</label>
              <Textarea value={emailBody} onChange={(e) => setEmailBody(e.target.value)} className="min-h-[140px] resize-none text-sm" />
              <p className="text-xs text-gray-400 mt-1">The PO PDF and artwork files will be automatically attached.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailPOVendor(null)}>Cancel</Button>
            <Button
              onClick={() => {
                if (!emailPOVendor || !vendorEmail.trim()) return;
                sendPOEmailMutation.mutate({
                  doc: emailPOVendor.doc, email: vendorEmail, name: vendorName,
                  subject: emailSubject, body: emailBody,
                });
              }}
              disabled={sendPOEmailMutation.isPending || !vendorEmail.trim()}
              className="gap-1"
            >
              {sendPOEmailMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Send PO
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Upload Vendor Proof ── */}
      <FilePickerDialog
        open={!!uploadProofArt}
        onClose={() => setUploadProofArt(null)}
        onSelect={(files) => {
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
        }}
        multiple={false}
        contextOrderId={orderId}
        title="Upload Vendor Proof"
      />

      {/* ── Send Proof to Client Dialog ── */}
      <Dialog open={!!sendProofArt} onOpenChange={(open) => !open && setSendProofArt(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5" /> Send Proof to Client
            </DialogTitle>
            <DialogDescription>
              Send the artwork proof to your client for approval.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {sendProofArt?.proofFilePath && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
                <div className="w-14 h-14 flex-shrink-0 bg-white rounded border overflow-hidden">
                  <img src={sendProofArt.proofFilePath} alt="Proof" className="w-full h-full object-contain p-0.5" />
                </div>
                <div>
                  <p className="text-sm font-medium">Vendor Proof</p>
                  <p className="text-xs text-gray-500">{sendProofArt.proofFileName || "proof-file"}</p>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Client Email</label>
                <Input value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Client Name</label>
                <Input value={clientName} onChange={(e) => setClientName(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Message</label>
              <Textarea value={clientMessage} onChange={(e) => setClientMessage(e.target.value)} className="min-h-[120px] resize-none text-sm" />
              <p className="text-xs text-gray-400 mt-1">An approval link will be automatically included.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendProofArt(null)}>Cancel</Button>
            <Button onClick={() => {
              if (!sendProofArt || !clientEmail.trim()) return;
              sendClientProofMutation.mutate({ art: sendProofArt, email: clientEmail, name: clientName, message: clientMessage });
            }} disabled={sendClientProofMutation.isPending || !clientEmail.trim()} className="gap-1">
              {sendClientProofMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Send Proof
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PO Preview Dialog */}
      <Dialog open={!!previewPO} onOpenChange={(open) => !open && setPreviewPO(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" /> Purchase Order Preview
            </DialogTitle>
          </DialogHeader>
          {previewPO && (
            <div className="space-y-4">
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-bold text-lg">PURCHASE ORDER</h3>
                    <p className="text-sm text-gray-600">Order: {(order as any)?.orderNumber || orderId}</p>
                    <p className="text-sm text-gray-600">Date: {new Date().toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{previewPO.vendor.name}</p>
                    {previewPO.vendor.email && <p className="text-sm text-gray-600">{previewPO.vendor.email}</p>}
                  </div>
                </div>
              </div>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 border-b">
                    <tr>
                      <th className="text-left p-3 font-semibold">Product</th>
                      <th className="text-right p-3 font-semibold">Qty</th>
                      <th className="text-right p-3 font-semibold">Cost</th>
                      <th className="text-right p-3 font-semibold">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewPO.items.map((item: any) => {
                      const qty = item.quantity || 0;
                      const cost = parseFloat(item.cost || item.unitPrice || "0");
                      return (
                        <tr key={item.id} className="border-b">
                          <td className="p-3"><p className="font-medium">{item.productName}</p><p className="text-xs text-gray-500">{item.productSku}</p></td>
                          <td className="p-3 text-right">{qty}</td>
                          <td className="p-3 text-right">${cost.toFixed(2)}</td>
                          <td className="p-3 text-right font-medium">${(qty * cost).toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-gray-50"><tr><td colSpan={2} className="p-3 font-bold">TOTAL</td><td></td><td className="p-3 text-right font-bold text-blue-700">${previewPO.totalCost.toFixed(2)}</td></tr></tfoot>
                </table>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewPO(null)}>Close</Button>
            <Button variant="outline" onClick={() => { previewPO && copyPOToClipboard(previewPO); }}><Copy className="w-4 h-4 mr-2" /> Copy</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document Editor */}
      {previewDocument && (
        <DocumentEditor document={previewDocument} order={order} orderItems={orderItems}
          companyName={(data as any).companyName || ""} primaryContact={(data as any).primaryContact}
          getEditedItem={getEditedItem} onClose={() => setPreviewDocument(null)}
          allArtworkItems={allArtworkItems} />
      )}

      {/* File Preview */}
      {previewFile && (
        <FilePreviewModal open={true}
          file={{ fileName: previewFile.name, originalName: previewFile.name, filePath: previewFile.url,
            mimeType: previewFile.url.match(/\.(png|jpg|jpeg|gif|webp|svg)$/i) ? "image/png" : "application/pdf" }}
          onClose={() => setPreviewFile(null)} />
      )}
    </div>
  );
}
