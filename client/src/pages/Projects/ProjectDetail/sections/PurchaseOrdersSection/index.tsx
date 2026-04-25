import { PdfPreviewDialog } from "@/components/documents/pdf/PdfPreviewDialog";
import { useAutoFillSender } from "@/components/email/useAutoFillSender";
import FilePickerDialog from "@/components/modals/FilePickerDialog";
import { FilePreviewModal } from "@/components/modals/FilePreviewModal";
import { EditableDate } from "@/components/shared/InlineEditable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useUpdateArtwork } from "@/services/project-items/mutations";
import {
  AlertTriangle, Calendar, ClipboardList, FileText, Loader2, Send,
} from "lucide-react";
import { useMemo } from "react";
import * as React from "react";
import type { GeneratedDocument } from "@shared/schema";
import type { OrderVendor } from "@/types/project-types";
import { usePurchaseOrdersSection } from "./hooks";
import type { PurchaseOrdersSectionProps, VendorArtwork } from "./types";
import VendorCard from "./components/VendorCard";
import type { VendorCardActions, VendorCardContext } from "./components/VendorCard";
import EmailVendor from "./components/EmailVendor";
import EmailClientProof from "./components/EmailClientProof";
import type { EmailClientProofProps } from "./components/EmailClientProof";

export default function PurchaseOrdersSection({ projectId, data, isLocked }: PurchaseOrdersSectionProps) {
  const hook = usePurchaseOrdersSection({ projectId, data, isLocked });
  const { toast } = useToast();
  const sender = useAutoFillSender();
  const updateArtworkMutation = useUpdateArtwork(projectId);

  // Dialog states
  const [previewVendorKey, setPreviewVendorKey] = React.useState<string | null>(null);
  const [expandedVendors, setExpandedVendors] = React.useState<Set<string>>(new Set());
  const [generatingVendorId, setGeneratingVendorId] = React.useState<string | null>(null);
  const [emailPOVendor, setEmailPOVendor] = React.useState<{ doc: GeneratedDocument; vendor: OrderVendor } | null>(null);
  const [uploadProofArt, setUploadProofArt] = React.useState<VendorArtwork | null>(null);
  const [sendProofArts, setSendProofArts] = React.useState<VendorArtwork[]>([]);
  const [previewFile, setPreviewFile] = React.useState<{ url: string; name: string } | null>(null);

  // Simple dialog helpers
  const toggleVendor = (vendorId: string) => {
    setExpandedVendors(prev => {
      const next = new Set(prev);
      if (next.has(vendorId)) next.delete(vendorId); else next.add(vendorId);
      return next;
    });
  };

  const openSendProofsDialog = (artworks: VendorArtwork[]) => {
    if (artworks.length === 0) {
      toast({ title: "No proofs ready to send", description: "Upload vendor proofs first.", variant: "destructive" });
      return;
    }
    setSendProofArts(artworks);
  };

  const openSendAllVendorProofs = () => {
    openSendProofsDialog(hook.getAllSendableProofs());
  };

  const handleProofUploaded = (files: Array<{ cloudinaryUrl: string; originalName?: string; fileName?: string }>) => {
    const file = files[0];
    if (file && uploadProofArt) {
      updateArtworkMutation.mutate({
        itemId: uploadProofArt.orderItemId,
        artworkId: uploadProofArt.id,
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

  // Wrap handleGeneratePO to manage local generatingVendorId state
  const handleGeneratePO = async (vendorKey: string, vendorName: string) => {
    setGeneratingVendorId(vendorKey);
    try {
      await hook.handleGeneratePO(vendorKey, vendorName);
    } finally {
      setGeneratingVendorId(null);
    }
  };

  // Shared context for all VendorCards
  const vendorCardContext: VendorCardContext = useMemo(() => ({
    order: hook.order || null,
    projectId: hook.projectId,
    companyName: hook.data.companyName || "",
    primaryContact: hook.data.primaryContact,
    allItemCharges: hook.allItemCharges,
    allArtworkItems: hook.allArtworkItems,
    allArtworkCharges: hook.allArtworkCharges,
    hasSupplierIHD: hook.hasSupplierIHD,
    getVendorDefaultAddress: hook.getVendorDefaultAddress,
  }), [hook.order, hook.projectId, hook.data,
    hook.allItemCharges, hook.allArtworkItems, hook.allArtworkCharges,
    hook.hasSupplierIHD, hook.getVendorDefaultAddress]);

  // Shared actions for all VendorCards
  const vendorCardActions: VendorCardActions = useMemo(() => ({
    onPreviewPO: (vendorKey: string) => setPreviewVendorKey(vendorKey),
    onGeneratePO: handleGeneratePO,
    onRegeneratePO: hook.handleRegeneratePO,
    onEmailPO: (doc: GeneratedDocument, vendor: OrderVendor) => setEmailPOVendor({ doc, vendor }),
    onUploadProof: setUploadProofArt,
    onSendProofs: openSendProofsDialog,
    onPreviewFile: setPreviewFile,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [hook.handleRegeneratePO]);

  // Merge data for PO email template
  const poMergeData = useMemo(() => ({
    companyName: hook.data.companyName || "",
    senderName: sender.name || "",
    vendorName: emailPOVendor?.vendor.name || "",
    vendorContactName: emailPOVendor?.vendor.contactPerson || emailPOVendor?.vendor.name || "",
    orderNumber: hook.order?.orderNumber || "",
    poNumber: emailPOVendor?.doc.documentNumber || "",
    supplierInHandsDate: (() => {
      const ihd = (emailPOVendor?.doc?.metadata as Record<string, unknown> | undefined)?.supplierIHD || hook.order?.supplierInHandsDate;
      return ihd ? new Date(ihd as string).toLocaleDateString() : "";
    })(),
  }), [emailPOVendor, hook.order, hook.data, sender]);

  // Merge data for Proof email template
  const proofMergeData = useMemo(() => ({
    companyName: hook.data.companyName || "",
    senderName: sender.name || "",
    recipientName: hook.data.primaryContact ? `${hook.data.primaryContact.firstName} ${hook.data.primaryContact.lastName}` : "",
    recipientFirstName: hook.data.primaryContact?.firstName || "there",
    artworkList: sendProofArts.map((a) => `  - ${a.productName} (${a.location || a.artworkType || "Artwork"})`).join("\n"),
  }), [hook.data, sendProofArts, sender]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <ClipboardList className="w-5 h-5" /> Purchase Orders
          </h2>
          <Badge variant="secondary" className="text-xs">
            {hook.vendorPOs.length} vendor{hook.vendorPOs.length !== 1 ? "s" : ""}
          </Badge>
        </div>
        {!hook.isLocked && hook.getAllSendableProofs().length > 0 && (
          <Button variant="default" size="sm" onClick={openSendAllVendorProofs}>
            <Send className="w-4 h-4 mr-1.5" />
            Send All Proofs to Client ({hook.getAllSendableProofs().length})
          </Button>
        )}
      </div>

      {/* Supplier IHD Date Card */}
      <Card className="bg-blue-50/60 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-blue-600" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-blue-900">Supplier In-Hands Date</span>
                  <span className="text-red-500 text-xs font-bold">* Required</span>
                </div>
                <p className="text-xs text-blue-600">Default date for all vendors — override per PO below</p>
              </div>
            </div>
            <EditableDate
              value={hook.order?.supplierInHandsDate}
              field="supplierInHandsDate"
              onSave={hook.updateField}
              emptyText="Click to set date"
              isLocked={hook.isLocked}
              isPending={hook.isFieldPending}
            />
          </div>
          {hook.order?.inHandsDate && (
            <div className="mt-2 pt-2 border-t border-blue-200 flex items-center gap-4 text-xs text-blue-700">
              <span>Customer In-Hands: <strong>{new Date(hook.order!.inHandsDate).toLocaleDateString()}</strong></span>
              {hook.order?.eventDate && (
                <span>Event Date: <strong>{new Date(hook.order!.eventDate).toLocaleDateString()}</strong></span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Supplier IHD Warning */}
      {!hook.hasSupplierIHD && hook.orderItems.length > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>Supplier In-Hands Date is required before generating POs. Set the date above.</span>
        </div>
      )}

      {/* Shipping Warnings */}
      {!hook.hasShippingAddress && hook.orderItems.length > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>No shipping address set. POs require a ship-to address — set it in the Sales Order section.</span>
        </div>
      )}
      {hook.hasShippingAddress && !hook.allShippingConfigured && hook.orderItems.length > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>Not all products have shipping details configured. Complete shipping details in the Shipping tab before generating POs.</span>
        </div>
      )}

      {/* Dual-PO reminder */}
      {hook.itemsMissingDecorator.length > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Dual PO workflow recommended</p>
            <p className="text-xs text-blue-800 mt-0.5">
              {hook.itemsMissingDecorator.length} item{hook.itemsMissingDecorator.length > 1 ? "s" : ""} with artwork {hook.itemsMissingDecorator.length > 1 ? "are" : "is"} routed as "Supplier Decorator" — only one PO will be generated.
              For apparel orders that need blanks shipped to a decorator first, edit each product and set <strong>Decorator Type → Third-Party Decorator</strong>. This splits the work into two POs: one for the blanks, one for the decorator.
            </p>
          </div>
        </div>
      )}

      {/* Batch generate all outstanding POs */}
      {hook.vendorPOs.length > 1 && hook.vendorPOs.some((po) => !hook.getVendorDoc(po.vendor.vendorKey || po.vendor.id)) && (
        <div className="flex items-center justify-between rounded-lg border bg-white px-4 py-3">
          <div className="text-sm">
            <p className="font-medium">Generate POs in bulk</p>
            <p className="text-xs text-gray-500">Create PDFs for every vendor that doesn't have one yet.</p>
          </div>
          <Button size="sm" onClick={hook.handleGenerateAllPOs} disabled={hook.isGenerating || !!generatingVendorId || hook.isLocked}>
            {generatingVendorId ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <FileText className="w-3.5 h-3.5 mr-1.5" />}
            Generate All POs
          </Button>
        </div>
      )}

      {/* Empty state */}
      {hook.vendorPOs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No vendors on this order</h3>
            <p className="text-sm text-gray-500">Add products with vendor/supplier info to generate POs</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {hook.vendorPOs.map((po) => {
            const vendorKey = po.vendor.vendorKey || po.vendor.id;
            return (
              <VendorCard
                key={vendorKey}
                po={po}
                isExpanded={expandedVendors.has(vendorKey)}
                onToggle={() => toggleVendor(vendorKey)}
                vendorDoc={hook.getVendorDoc(vendorKey) || null}
                vendorItemsHash={hook.vendorHashes[vendorKey] || ""}
                isLocked={!!hook.isLocked}
                isGenerating={hook.isGenerating}
                isVendorGenerating={generatingVendorId === vendorKey}
                actions={vendorCardActions}
                context={vendorCardContext}
              />
            );
          })}

          {/* Grand totals */}
          <Card className="bg-purple-50/60">
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-5">
                  <div>
                    <span className="text-gray-500 text-xs">Vendors</span>
                    <p className="font-semibold">{hook.vendorPOs.length}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs">Total Qty</span>
                    <p className="font-semibold">{hook.grandTotalQty}</p>
                  </div>
                  {hook.order?.supplierInHandsDate && (
                    <div>
                      <span className="text-gray-500 text-xs">Supplier IHD</span>
                      <p className="font-semibold text-blue-700">{new Date(hook.order!.supplierInHandsDate).toLocaleDateString()}</p>
                    </div>
                  )}
                  {hook.order?.inHandsDate && (
                    <div>
                      <span className="text-gray-500 text-xs">Customer IHD</span>
                      <p className="font-semibold">{new Date(hook.order!.inHandsDate).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-500">Total PO Cost</span>
                  <p className="text-lg font-bold text-purple-700">${hook.grandTotalCost.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Live PDF preview */}
      <PdfPreviewDialog
        open={!!previewVendorKey}
        onOpenChange={(open) => !open && setPreviewVendorKey(null)}
        title="PO Preview"
        document={previewVendorKey ? hook.buildVendorPoDoc(previewVendorKey) : null}
      />

      {/* Email PO to Vendor */}
      <EmailVendor
        open={!!emailPOVendor}
        onClose={() => setEmailPOVendor(null)}
        doc={emailPOVendor?.doc || null}
        vendor={emailPOVendor?.vendor || null}
        order={hook.order || null}
        projectId={hook.projectId}
        poMergeData={poMergeData}
        orderItems={hook.orderItems}
        allArtworkItems={hook.allArtworkItems}
      />

      {/* Upload Vendor Proof */}
      <FilePickerDialog
        open={!!uploadProofArt}
        onClose={() => setUploadProofArt(null)}
        onSelect={handleProofUploaded}
        multiple={false}
        contextProjectId={hook.projectId}
        title="Upload Vendor Proof"
      />

      {/* Send Batch Proofs to Client */}
      <EmailClientProof
        open={sendProofArts.length > 0}
        onClose={() => setSendProofArts([])}
        sendProofArts={sendProofArts}
        data={hook.data as EmailClientProofProps["data"]}
        order={hook.order || null}
        orderItems={hook.orderItems}
        suppliers={hook.suppliers as EmailClientProofProps["suppliers"]}
        proofMergeData={proofMergeData}
        projectId={hook.projectId}
        updateArtworkMutate={(params) => updateArtworkMutation.mutate({
          itemId: params.orderItemId, artworkId: params.artworkId, updates: params.updates,
        })}
      />

      {/* File Preview */}
      {previewFile && (
        <FilePreviewModal open={true}
          file={{
            fileName: previewFile.name, originalName: previewFile.name, filePath: previewFile.url,
            mimeType: previewFile.url.match(/\.(png|jpg|jpeg|gif|webp|svg)$/i) ? "image/png" : "application/pdf"
          }}
          onClose={() => setPreviewFile(null)} />
      )}
    </div>
  );
}
