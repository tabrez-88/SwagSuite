import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertTriangle, Building2, Calendar, ChevronDown, ChevronRight,
  ClipboardList, Eye, FileText, Loader2, Mail, MessageSquare, MoreHorizontal, Package,
  Palette, Printer, Send,
} from "lucide-react";
import { useState } from "react";
import type { GeneratedDocument } from "@shared/schema";
import type { OrderVendor } from "@/types/project-types";
import type { VendorArtwork, VendorPO } from "../../types";
import { PO_STATUSES } from "../../types";
import ProductPoItem from "../ProductPoItem";
import ArtworkProofItem from "../ArtworkProofItem";
import VendorCostSummary from "../VendorCostSummary";
import VendorStageControls from "../VendorStageControls";
import PoPreview from "../PoPreview";
import NotifyVendor from "../NotifyVendor";
import { useVendorCardMutations } from "./hooks";

// ── Grouped prop interfaces ──

export interface VendorCardActions {
  onPreviewPO: (vendorKey: string) => void;
  onGeneratePO: (vendorKey: string, name: string) => void;
  onRegeneratePO: (doc: GeneratedDocument) => void;
  onEmailPO: (doc: GeneratedDocument, vendor: OrderVendor) => void;
  onUploadProof: (art: VendorArtwork) => void;
  onSendProofs: (artworks: VendorArtwork[]) => void;
  onPreviewFile: (file: { url: string; name: string }) => void;
}

export interface VendorCardContext {
  order: Record<string, unknown> | null;
  projectId: string;
  companyName: string;
  primaryContact?: { firstName?: string; lastName?: string; email?: string } | null;
  allItemCharges: Record<string, Array<Record<string, unknown>>>;
  allArtworkItems: Record<string, Array<Record<string, unknown>>>;
  allArtworkCharges: Record<string, Array<Record<string, unknown>>>;
  hasSupplierIHD: boolean;
  getVendorDefaultAddress: (id: string) => Record<string, unknown> | null;
}

export interface VendorCardProps {
  po: VendorPO;
  isExpanded: boolean;
  onToggle: () => void;
  vendorDoc: GeneratedDocument | null;
  vendorItemsHash: string;
  isLocked: boolean;
  isGenerating: boolean;
  isVendorGenerating: boolean;
  actions: VendorCardActions;
  context: VendorCardContext;
}

export default function VendorCard({
  po, isExpanded, onToggle, vendorDoc, vendorItemsHash, isLocked, isGenerating, isVendorGenerating,
  actions, context,
}: VendorCardProps) {
  const vendorKey = po.vendor.vendorKey || po.vendor.id;

  // Own mutations hook
  const {
    PO_STAGES, getInitialStage, getNextStage,
    actionTypes, vendorArtworks,
    getDocStage, getDocStatus, isVendorDocStale,
    updateDocMetaMutation, updateArtworkMutation,
    handleOpenArtworkApprovalLink,
  } = useVendorCardMutations({
    projectId: context.projectId,
    po,
    vendorItemsHash,
    allArtworkItems: context.allArtworkItems,
    primaryContact: context.primaryContact,
    companyName: context.companyName,
  });

  // Local dialog states
  const [showTextPreview, setShowTextPreview] = useState(false);
  const [showNotifyVendor, setShowNotifyVendor] = useState(false);
  const isDecorator = po.vendor.role === "decorator";
  const poStage = vendorDoc ? getDocStage(vendorDoc) : null;
  const poStatus = vendorDoc ? getDocStatus(vendorDoc) : null;
  const initialStageId = getInitialStage()?.id || "created";
  const stageInfo = poStage ? PO_STAGES[poStage] || PO_STAGES[initialStageId] : null;
  const statusInfo = poStatus ? PO_STATUSES[poStatus] || PO_STATUSES.ok : null;
  const docMeta = vendorDoc?.metadata as Record<string, unknown> | null;
  const vendorIhdValue = docMeta?.supplierIHD;
  const effectiveIhd = vendorIhdValue || context.order?.supplierInHandsDate;

  const onUpdateDocMeta = (params: { docId: string; updates: Record<string, unknown> }) =>
    updateDocMetaMutation.mutate(params);
  const isDocMetaUpdating = updateDocMetaMutation.isPending;

  // Sendable proofs for this vendor
  const sendableProofs = vendorArtworks.filter(
    (a) => a.proofRequired !== false && a.proofFilePath && ["proof_received", "change_requested"].includes(a.status),
  );

  return (
    <>
    <Card className="overflow-hidden">
      {/* Vendor header row */}
      <div className="p-4 cursor-pointer hover:bg-gray-50 transition-colors" onClick={onToggle}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
            <Building2 className={`w-5 h-5 ${isDecorator ? "text-purple-500" : "text-blue-500"}`} />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm">{po.vendor.name}</h3>
                {isDecorator && <Badge variant="outline" className="text-[10px] border-purple-200 text-purple-600 bg-purple-50">Decorator</Badge>}
                {stageInfo && <Badge variant="outline" className={`text-[10px] ${stageInfo.color}`}>{stageInfo.label}</Badge>}
                {statusInfo && poStatus !== "ok" && <Badge variant="outline" className={`text-[10px] ${statusInfo.color}`}>{statusInfo.label}</Badge>}
                {vendorDoc && isVendorDocStale(vendorDoc) && (
                  <Badge variant="outline" className="text-[10px] border-orange-300 text-orange-600 bg-orange-50">
                    <AlertTriangle className="w-2.5 h-2.5 mr-0.5" /> Outdated
                  </Badge>
                )}
                {effectiveIhd ? (
                  <Badge variant="outline" className={`text-[10px] ${vendorIhdValue ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                    <Calendar className="w-3 h-3 mr-1" />
                    Supplier IHD: {new Date(effectiveIhd as string).toLocaleDateString()}
                    {vendorIhdValue ? <span className="ml-1 text-[8px]">(custom)</span> : null}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] bg-red-50 text-red-600 border-red-200">
                    No IHD set
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                {po.vendor.contactPerson && <span>Attn: {po.vendor.contactPerson}</span>}
                {po.vendor.email && <span>{po.vendor.email}</span>}
                {(() => {
                  const addr = context.getVendorDefaultAddress(po.vendor.id);
                  if (!addr) return null;
                  const parts = [addr.city, addr.state].filter(Boolean).join(", ");
                  return parts ? <span className="text-gray-400">| {parts as string}</span> : null;
                })()}
              </div>
              {/* Ship-to summary from first item */}
              {(() => {
                const firstShipTo = po.items.find(i => i.shipToAddress)?.shipToAddress as { companyName?: string; city?: string; state?: string } | null;
                if (!firstShipTo) return null;
                const shipParts = [firstShipTo.companyName, [firstShipTo.city, firstShipTo.state].filter(Boolean).join(", ")].filter(Boolean).join(" — ");
                return shipParts ? (
                  <div className="flex items-center gap-1.5 text-[11px] text-gray-500 mt-0.5">
                    <Package className="w-3 h-3" />
                    <span className="font-bold">Ship to: <span className="text-gray-600 font-medium">{shipParts}</span></span>
                  </div>
                ) : null;
              })()}
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
            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1"
                onClick={() => actions.onPreviewPO(vendorKey)}>
                <Eye className="w-3 h-3" /> Preview
              </Button>
              {!vendorDoc ? (
                <Button variant="default" size="sm" className="h-7 text-xs gap-1"
                  onClick={() => actions.onGeneratePO(vendorKey, po.vendor.name)}
                  disabled={isVendorGenerating || isGenerating || isLocked || (!context.hasSupplierIHD && !isDecorator)}>
                  {isVendorGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />}
                  Generate PO
                </Button>
              ) : (
                <>
                  {isVendorDocStale(vendorDoc) && (
                    <Button variant="destructive" size="sm" className="h-7 text-xs gap-1"
                      onClick={() => actions.onRegeneratePO(vendorDoc)}
                      disabled={isGenerating || isLocked}>
                      {isVendorGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <AlertTriangle className="w-3 h-3" />}
                      Regenerate PO
                    </Button>
                  )}
                  {poStage === initialStageId && (
                    <Button variant="default" size="sm" className="h-7 text-xs gap-1"
                      onClick={() => actions.onEmailPO(vendorDoc, po.vendor)} disabled={isLocked}>
                      <Mail className="w-3 h-3" /> Email to Vendor
                    </Button>
                  )}
                  {poStage && poStage !== initialStageId && (() => {
                    const nextStage = getNextStage(poStage);
                    return nextStage ? (
                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1 border-green-200 text-green-700"
                        onClick={() => onUpdateDocMeta({
                          docId: vendorDoc.id,
                          updates: { metadata: { ...(vendorDoc.metadata as Record<string, unknown> || {}), poStage: nextStage.id } },
                        })}
                        disabled={isLocked || isDocMetaUpdating}>
                        {isDocMetaUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                        Advance to {nextStage.name}
                      </Button>
                    ) : null;
                  })()}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-7 w-7 p-0">
                        <MoreHorizontal className="w-3 h-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {poStage !== initialStageId && (
                        <DropdownMenuItem onClick={() => actions.onEmailPO(vendorDoc, po.vendor)}>
                          <Mail className="w-4 h-4 mr-2" /> Resend PO
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => setShowTextPreview(true)}>
                        <ClipboardList className="w-4 h-4 mr-2" /> Text Preview / Copy
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setShowNotifyVendor(true)}>
                        <MessageSquare className="w-4 h-4 mr-2" /> Message Vendor
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => actions.onRegeneratePO(vendorDoc)}
                        disabled={isGenerating || isLocked}
                        className="text-orange-600"
                      >
                        {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Printer className="w-4 h-4 mr-2" />}
                        {isGenerating ? "Regenerating..." : "Regenerate PO"}
                      </DropdownMenuItem>
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
          {vendorDoc && (
            <VendorStageControls
              vendorDoc={vendorDoc}
              PO_STAGES={PO_STAGES}
              PO_STATUSES={PO_STATUSES}
              actionTypes={actionTypes}
              isLocked={isLocked}
              onUpdateDocMeta={onUpdateDocMeta}
              isUpdating={isDocMetaUpdating}
              order={context.order}
              initialStageId={initialStageId}
            />
          )}

          {/* Items List */}
          <div className="bg-gray-50/50">
            {po.items.map((item, idx) => {
              const itemLines = po.lines[item.id] || [];
              const itemRunCharges = (context.allItemCharges[item.id] || []).filter((c) => c.chargeCategory === "run");
              const itemFixedCharges = (context.allItemCharges[item.id] || []).filter((c) => c.chargeCategory === "fixed" || (!c.chargeCategory && !c.includeInUnitPrice));
              const itemArts = context.allArtworkItems[item.id] || [];
              const itemArtworkCharges: Array<Record<string, unknown>> = [];
              itemArts.forEach((art) => {
                ((context.allArtworkCharges[art.id as string] || []) as Array<Record<string, unknown>>).forEach((c) => {
                  itemArtworkCharges.push({ ...c, artworkName: (art.name as string) || "Artwork" });
                });
              });
              return (
                <ProductPoItem
                  key={item.id}
                  item={item}
                  lines={itemLines}
                  runCharges={itemRunCharges as Array<{ id: string; description?: string; chargeName?: string; chargeCategory?: string; netCost?: string; amount?: string; quantity?: number; includeInUnitPrice?: boolean; artworkName?: string; [key: string]: unknown }>}
                  fixedCharges={itemFixedCharges as Array<{ id: string; description?: string; chargeName?: string; chargeCategory?: string; netCost?: string; amount?: string; quantity?: number; includeInUnitPrice?: boolean; artworkName?: string; [key: string]: unknown }>}
                  artworkCharges={itemArtworkCharges as Array<{ id: string; description?: string; chargeName?: string; chargeCategory?: string; netCost?: string; amount?: string; quantity?: number; includeInUnitPrice?: boolean; artworkName?: string; [key: string]: unknown }>}
                  isLast={idx === po.items.length - 1}
                />
              );
            })}
          </div>

          {/* Vendor Cost Summary */}
          <VendorCostSummary
            items={po.items}
            allItemCharges={context.allItemCharges}
            allArtworkItems={context.allArtworkItems}
            allArtworkCharges={context.allArtworkCharges}
            lines={po.lines}
          />

          {/* Proofing Section */}
          {vendorArtworks.length > 0 && (
            <div className="border-t p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Palette className="w-4 h-4 text-purple-500" />
                  Artwork Proofs
                  <Badge variant="secondary" className="text-[10px]">
                    {vendorArtworks.filter((a) => a.proofRequired !== false && ["approved", "proofing_complete"].includes(a.status)).length}/{vendorArtworks.filter((a) => a.proofRequired !== false).length} approved
                  </Badge>
                </h4>
                {!isLocked && sendableProofs.length > 0 && (
                  <Button variant="default" size="sm" className="h-7 text-xs gap-1"
                    onClick={() => actions.onSendProofs(sendableProofs)}>
                    <Send className="w-3 h-3" /> Send All Proofs to Client
                  </Button>
                )}
              </div>
              <div className="space-y-3">
                {vendorArtworks.map((art) => (
                  <ArtworkProofItem
                    key={art.id}
                    artwork={art}
                    isLocked={isLocked}
                    onUpdateArtwork={(params) => updateArtworkMutation.mutate(params)}
                    isUpdating={updateArtworkMutation.isPending}
                    onUploadProof={actions.onUploadProof}
                    onOpenApprovalLink={handleOpenArtworkApprovalLink}
                    onPreviewFile={actions.onPreviewFile}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>

      {/* VendorCard-owned dialogs */}
      <PoPreview
        open={showTextPreview}
        onClose={() => setShowTextPreview(false)}
        vendorPO={po}
        order={context.order}
        projectId={context.projectId}
        allArtworkItems={context.allArtworkItems}
        getVendorDefaultAddress={context.getVendorDefaultAddress}
      />

      <NotifyVendor
        open={showNotifyVendor}
        onClose={() => setShowNotifyVendor(false)}
        vendor={po.vendor}
        projectId={context.projectId}
      />

    </>
  );
}
