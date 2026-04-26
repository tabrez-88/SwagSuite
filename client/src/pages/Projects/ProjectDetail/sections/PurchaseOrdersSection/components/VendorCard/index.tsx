import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertTriangle,
  Building2,
  Calendar,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Eye,
  FileText,
  Loader2,
  Mail,
  MessageSquare,
  MoreHorizontal,
  Package,
  Palette,
  Printer,
  Send,
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
// ShipStation — uncomment when integration is live
// import { pushOrderToShipStation } from "@/services/settings/requests";
// import { useIntegrationSettings } from "@/services/settings/queries";
import type { GeneratedDocument } from "@shared/schema";
import type { OrderVendor } from "@/types/project-types";
import type { VendorArtwork, VendorPO } from "../../types";
import { PO_STATUSES } from "../../types";
import type { PurchaseOrderEntity } from "@/services/purchase-orders";
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
  onSendConfirmation?: (poEntityId: string) => void;
}

export interface VendorCardContext {
  order: Record<string, unknown> | null;
  projectId: string;
  companyName: string;
  primaryContact?: {
    firstName?: string;
    lastName?: string;
    email?: string;
  } | null;
  allItemCharges: Record<string, Array<Record<string, unknown>>>;
  allArtworkItems: Record<string, Array<Record<string, unknown>>>;
  allArtworkCharges: Record<string, Array<Record<string, unknown>>>;
  hasSupplierIHD: boolean;
  getVendorDefaultAddress: (id: string) => Record<string, unknown> | null;
}

export interface VendorCardProps {
  po: VendorPO;
  poEntity: PurchaseOrderEntity | null;
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
  po,
  poEntity,
  isExpanded,
  onToggle,
  vendorDoc,
  vendorItemsHash,
  isLocked,
  isGenerating,
  isVendorGenerating,
  actions,
  context,
}: VendorCardProps) {
  const vendorKey = po.groupKey;

  // Own mutations hook
  const {
    PO_STAGES,
    getInitialStage,
    getNextStage,
    actionTypes,
    vendorArtworks,
    getDocStage,
    getDocStatus,
    isVendorDocStale,
    updateDocMetaMutation,
    updateArtworkMutation,
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
  const { toast } = useToast();
  // ShipStation export — hidden until integration is live
  // const { data: integrationSettings } = useIntegrationSettings();
  // const isShipStationConnected = !!(integrationSettings as any)?.shipstationConnected;
  // const pushToShipStationMutation = useMutation({
  //   mutationFn: () => pushOrderToShipStation(context.order?.id as string),
  //   onSuccess: (data) => {
  //     toast({ title: "Exported to ShipStation", description: data.message });
  //   },
  //   onError: (err: Error) => {
  //     toast({ title: "ShipStation Export Failed", description: err.message, variant: "destructive" });
  //   },
  // });

  const isDecorator = po.vendor.role === "decorator";
  // Prefer PO entity stage over doc metadata
  const poStage = poEntity?.currentStageId || (vendorDoc ? getDocStage(vendorDoc) : null);
  const poStatus = vendorDoc ? getDocStatus(vendorDoc) : null;
  const initialStageId = getInitialStage()?.id || "created";
  const stageInfo = poStage
    ? PO_STAGES[poStage] || PO_STAGES[initialStageId]
    : null;
  const statusInfo = poStatus ? PO_STATUSES[poStatus] || PO_STATUSES.ok : null;
  const docMeta = vendorDoc?.metadata as Record<string, unknown> | null;
  const vendorIhdValue = docMeta?.supplierIHD;
  const effectiveIhd = vendorIhdValue || context.order?.supplierInHandsDate;

  const onUpdateDocMeta = (params: {
    docId: string;
    updates: Record<string, unknown>;
  }) => updateDocMetaMutation.mutate(params);
  const isDocMetaUpdating = updateDocMetaMutation.isPending;

  // Sendable proofs for this vendor
  const sendableProofs = vendorArtworks.filter(
    (a) =>
      a.proofRequired !== false &&
      a.proofFilePath &&
      ["proof_received", "change_requested"].includes(a.status),
  );

  return (
    <>
      <Card className="overflow-hidden">
        {/* Vendor header row */}
        <div
          className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={onToggle}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-400" />
              )}
              <Building2 className={`w-5 h-5 flex-shrink-0 ${isDecorator ? "text-purple-500" : "text-blue-500"}`} />
              <div className="min-w-0">
                {/* Line 1: Vendor → Ship To + badges */}
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-sm">
                    {po.vendor.name}
                    {(() => {
                      const shipTo = po.items.find((i) => i.shipToAddress)?.shipToAddress as { companyName?: string; city?: string; state?: string } | null;
                      if (!shipTo) return null;
                      const dest = shipTo.companyName || [shipTo.city, shipTo.state].filter(Boolean).join(", ");
                      return dest ? <span className="text-gray-400 font-normal"> - {dest}</span> : null;
                    })()}
                  </h3>
                  {isDecorator && (
                    <Badge variant="outline" className="text-[10px] border-purple-200 text-purple-600 bg-purple-50">
                      Decorator
                    </Badge>
                  )}
                  {stageInfo && (
                    <Badge variant="outline" className={`text-[10px] ${stageInfo.color}`}>
                      {stageInfo.label}
                    </Badge>
                  )}
                  {statusInfo && poStatus !== "ok" && (
                    <Badge variant="outline" className={`text-[10px] ${statusInfo.color}`}>
                      {statusInfo.label}
                    </Badge>
                  )}
                  {vendorDoc && isVendorDocStale(vendorDoc) && (
                    <Badge variant="outline" className="text-[10px] border-orange-300 text-orange-600 bg-orange-50">
                      <AlertTriangle className="w-2.5 h-2.5 mr-0.5" /> Outdated
                    </Badge>
                  )}
                </div>
                {/* Line 2: Product names */}
                <p className="text-xs text-gray-500 truncate max-w-[400px]">
                  {(() => {
                    const names = po.items.map((i) => i.productName).filter(Boolean);
                    if (names.length === 0) return "No products";
                    if (names.length <= 2) return names.join(", ");
                    return `${names[0]}, ${names[1]} + ${names.length - 2} more`;
                  })()}
                </p>
                {/* Line 3: IHD + PO# + lifecycle */}
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  {effectiveIhd ? (
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${vendorIhdValue ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-gray-50 text-gray-600 border-gray-200"}`}
                    >
                      <Calendar className="w-3 h-3 mr-1" />
                      Required by: {new Date(effectiveIhd as string).toLocaleDateString()}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] bg-red-50 text-red-600 border-red-200">
                      No IHD set
                    </Badge>
                  )}
                  {poEntity?.poNumber && (
                    <span className="text-[10px] text-gray-400">PO# {poEntity.poNumber}</span>
                  )}
                  {poEntity?.confirmedAt && (
                    <span className="text-[10px] text-green-600">Confirmed {new Date(poEntity.confirmedAt).toLocaleDateString()}</span>
                  )}
                  {poEntity?.shippedAt && (
                    <span className="text-[10px] text-blue-600">Shipped {new Date(poEntity.shippedAt).toLocaleDateString()}</span>
                  )}
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
                <p className="font-semibold text-blue-600">
                  ${po.totalCost.toFixed(2)}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={() => actions.onPreviewPO(vendorKey)}
                >
                  <Eye className="w-3 h-3" /> Preview
                </Button>
                {!vendorDoc ? (
                  <Button
                    variant="default"
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={() =>
                      actions.onGeneratePO(vendorKey, po.vendor.name)
                    }
                    disabled={
                      isVendorGenerating ||
                      isGenerating ||
                      isLocked ||
                      (!context.hasSupplierIHD && !isDecorator)
                    }
                  >
                    {isVendorGenerating ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <FileText className="w-3 h-3" />
                    )}
                    Generate PO
                  </Button>
                ) : (
                  <>
                    {isVendorDocStale(vendorDoc) && (
                      <Button
                        variant="destructive"
                        size="sm"
                        className="h-7 text-xs gap-1"
                        onClick={() => actions.onRegeneratePO(vendorDoc)}
                        disabled={isGenerating || isLocked}
                      >
                        {isVendorGenerating ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <AlertTriangle className="w-3 h-3" />
                        )}
                        Regenerate PO
                      </Button>
                    )}
                    {poStage === initialStageId && (
                      <Button
                        variant="default"
                        size="sm"
                        className="h-7 text-xs gap-1"
                        onClick={() => actions.onEmailPO(vendorDoc, po.vendor)}
                        disabled={isLocked}
                      >
                        <Mail className="w-3 h-3" /> Email to Vendor
                      </Button>
                    )}
                    {poStage &&
                      poStage !== initialStageId &&
                      (() => {
                        const nextStage = getNextStage(poStage);
                        return nextStage ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs gap-1 border-green-200 text-green-700"
                            onClick={() =>
                              onUpdateDocMeta({
                                docId: vendorDoc.id,
                                updates: {
                                  metadata: {
                                    ...((vendorDoc.metadata as Record<
                                      string,
                                      unknown
                                    >) || {}),
                                    poStage: nextStage.id,
                                  },
                                },
                              })
                            }
                            disabled={isLocked || isDocMetaUpdating}
                          >
                            {isDocMetaUpdating ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Send className="w-3 h-3" />
                            )}
                            Advance to {nextStage.name}
                          </Button>
                        ) : null;
                      })()}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 w-7 p-0"
                        >
                          <MoreHorizontal className="w-3 h-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {poStage !== initialStageId && (
                          <DropdownMenuItem
                            onClick={() =>
                              actions.onEmailPO(vendorDoc, po.vendor)
                            }
                          >
                            <Mail className="w-4 h-4 mr-2" /> Resend PO
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => setShowTextPreview(true)}
                        >
                          <ClipboardList className="w-4 h-4 mr-2" /> Text
                          Preview / Copy
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setShowNotifyVendor(true)}
                        >
                          <MessageSquare className="w-4 h-4 mr-2" /> Message
                          Vendor
                        </DropdownMenuItem>
                        {poEntity && !poEntity.confirmedAt && actions.onSendConfirmation && (
                          <DropdownMenuItem
                            onClick={() => actions.onSendConfirmation!(poEntity.id)}
                          >
                            <Send className="w-4 h-4 mr-2" /> Send
                            Confirmation Link
                          </DropdownMenuItem>
                        )}
                        {/* ShipStation export — hidden until integration is live
                        {isShipStationConnected && !!context.order?.id && (
                          <DropdownMenuItem
                            onClick={() => pushToShipStationMutation.mutate()}
                            disabled={pushToShipStationMutation.isPending}
                          >
                            {pushToShipStationMutation.isPending ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Ship className="w-4 h-4 mr-2" />
                            )}
                            {pushToShipStationMutation.isPending ? "Exporting..." : "Export to ShipStation"}
                          </DropdownMenuItem>
                        )}
                        */}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => actions.onRegeneratePO(vendorDoc)}
                          disabled={isGenerating || isLocked}
                          className="text-orange-600"
                        >
                          {isGenerating ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Printer className="w-4 h-4 mr-2" />
                          )}
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
                const itemRunCharges = (
                  context.allItemCharges[item.id] || []
                ).filter((c) => c.chargeCategory === "run");
                const itemFixedCharges = (
                  context.allItemCharges[item.id] || []
                ).filter(
                  (c) =>
                    c.chargeCategory === "fixed" ||
                    (!c.chargeCategory && !c.includeInUnitPrice),
                );
                const itemArts = context.allArtworkItems[item.id] || [];
                const itemArtworkCharges: Array<Record<string, unknown>> = [];
                itemArts.forEach((art) => {
                  (
                    (context.allArtworkCharges[art.id as string] ||
                      []) as Array<Record<string, unknown>>
                  ).forEach((c) => {
                    itemArtworkCharges.push({
                      ...c,
                      artworkName: (art.name as string) || "Artwork",
                    });
                  });
                });
                return (
                  <ProductPoItem
                    key={item.id}
                    item={item}
                    lines={itemLines}
                    runCharges={
                      itemRunCharges as Array<{
                        id: string;
                        description?: string;
                        chargeName?: string;
                        chargeCategory?: string;
                        netCost?: string;
                        amount?: string;
                        quantity?: number;
                        includeInUnitPrice?: boolean;
                        artworkName?: string;
                        [key: string]: unknown;
                      }>
                    }
                    fixedCharges={
                      itemFixedCharges as Array<{
                        id: string;
                        description?: string;
                        chargeName?: string;
                        chargeCategory?: string;
                        netCost?: string;
                        amount?: string;
                        quantity?: number;
                        includeInUnitPrice?: boolean;
                        artworkName?: string;
                        [key: string]: unknown;
                      }>
                    }
                    artworkCharges={
                      itemArtworkCharges as Array<{
                        id: string;
                        description?: string;
                        chargeName?: string;
                        chargeCategory?: string;
                        netCost?: string;
                        amount?: string;
                        quantity?: number;
                        includeInUnitPrice?: boolean;
                        artworkName?: string;
                        [key: string]: unknown;
                      }>
                    }
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
                      {
                        vendorArtworks.filter(
                          (a) =>
                            a.proofRequired !== false &&
                            ["approved", "proofing_complete"].includes(
                              a.status,
                            ),
                        ).length
                      }
                      /
                      {
                        vendorArtworks.filter((a) => a.proofRequired !== false)
                          .length
                      }{" "}
                      approved
                    </Badge>
                  </h4>
                  {!isLocked && sendableProofs.length > 0 && (
                    <Button
                      variant="default"
                      size="sm"
                      className="h-7 text-xs gap-1"
                      onClick={() => actions.onSendProofs(sendableProofs)}
                    >
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
                      onUpdateArtwork={(params) =>
                        updateArtworkMutation.mutate(params)
                      }
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
