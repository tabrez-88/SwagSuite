import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle,
  ChevronRight,
  Clock,
  ExternalLink,
  FileText,
  Loader2,
  Mail,
  MapPin,
  Package,
  Palette,
  Phone,
  Truck,
  User,
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import {
  PO_STATUSES,
  PROOF_STATUSES,
  getPOStatusBadgeClass,
  getProofStatusBadgeClass,
} from "@/lib/poStages";
import { useProductionStages } from "@/hooks/useProductionStages";
import { getStageBadgeClass } from "@/lib/productionStages";
import { getDateStatus } from "@/lib/dateUtils";
import { useNextActionTypes, getActionTypeBadgeClass } from "@/hooks/useNextActionTypes";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FilePreviewModal } from "@/components/modals/FilePreviewModal";

interface PODetailPanelProps {
  documentId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PODetailPanel({ documentId, open, onOpenChange }: PODetailPanelProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [previewFile, setPreviewFile] = useState<{
    originalName: string;
    filePath: string;
    mimeType: string;
    fileName: string;
  } | null>(null);
  const { stages: productionStages } = useProductionStages();
  const { actionTypes } = useNextActionTypes();

  const { data: po, isLoading } = useQuery<any>({
    queryKey: [`/api/production/po-report/${documentId}`],
    enabled: !!documentId && open,
  });

  const updateStageMutation = useMutation({
    mutationFn: async ({ stage, status }: { stage?: string; status?: string }) => {
      const currentMeta = po?.metadata || {};
      const newMeta = {
        ...currentMeta,
        ...(stage && { poStage: stage }),
        ...(status && { poStatus: status }),
      };
      const response = await apiRequest("PATCH", `/api/documents/${documentId}`, {
        metadata: newMeta,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "PO Updated", description: "Purchase order has been updated." });
      queryClient.invalidateQueries({ queryKey: [`/api/production/po-report/${documentId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/production/po-report"] });
      queryClient.invalidateQueries({ queryKey: ["/api/production/alerts"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update PO.", variant: "destructive" });
    },
  });

  const updateNextActionMutation = useMutation({
    mutationFn: async (data: { nextActionType?: string; nextActionDate?: string | null; nextActionNotes?: string }) => {
      const response = await apiRequest("PATCH", `/api/orders/${po?.order_id}/production`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Next Action Updated" });
      queryClient.invalidateQueries({ queryKey: [`/api/production/po-report/${documentId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/production/po-report"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update next action.", variant: "destructive" });
    },
  });

  const poStage = po?.poStage || "created";
  const poStatus = po?.poStatus || "ok";

  // Calculate stage progress from dynamic stages
  const currentStageIdx = productionStages.findIndex((s: any) => s.id === poStage);
  const currentStageOrder = currentStageIdx >= 0 ? currentStageIdx + 1 : 1;
  const totalStages = productionStages.length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[600px] sm:max-w-[600px] overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : !po ? (
          <div className="text-center text-muted-foreground py-10">PO not found</div>
        ) : (
          <>
            <SheetHeader className="pb-4 border-b">
              <div className="flex items-center justify-between">
                <SheetTitle className="text-lg font-semibold">
                  PO #{po.document_number}
                </SheetTitle>
                <div className="flex gap-2">
                  <Badge className={getStageBadgeClass(productionStages, poStage)}>
                    {productionStages.find((s: any) => s.id === poStage)?.name || poStage}
                  </Badge>
                  <Badge className={getPOStatusBadgeClass(poStatus)}>
                    {PO_STATUSES[poStatus]?.label || poStatus}
                  </Badge>
                </div>
              </div>

              {/* Stage progress bar */}
              <div className="mt-3">
                <div className="flex items-center gap-1 mb-1">
                  {productionStages.map((stage: any, idx: number) => (
                    <div
                      key={stage.id}
                      className={`h-1.5 flex-1 rounded-full transition-colors ${
                        idx < currentStageOrder
                          ? "bg-primary"
                          : idx === currentStageOrder
                            ? "bg-primary/40"
                            : "bg-muted"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Stage {currentStageOrder} of {totalStages}
                </p>
              </div>

              {/* Quick actions */}
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setLocation(`/project/${po.order_id}`)}
                >
                  <ExternalLink className="h-3.5 w-3.5 mr-1" />
                  View Project
                </Button>
                {po.file_url && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPreviewFile({
                      originalName: `PO-${po.document_number}.pdf`,
                      filePath: po.file_url,
                      mimeType: "application/pdf",
                      fileName: `PO-${po.document_number}.pdf`,
                    })}
                  >
                    <FileText className="h-3.5 w-3.5 mr-1" />
                    View PDF
                  </Button>
                )}
              </div>
            </SheetHeader>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
              <TabsList className="w-full">
                <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
                <TabsTrigger value="proofing" className="flex-1">Proofing</TabsTrigger>
                <TabsTrigger value="shipping" className="flex-1">Shipping</TabsTrigger>
                <TabsTrigger value="details" className="flex-1">Details</TabsTrigger>
              </TabsList>

              {/* ── Overview Tab ── */}
              <TabsContent value="overview" className="space-y-4 mt-4">
                {/* Stage & Status Controls */}
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <h4 className="text-sm font-semibold">Stage & Status</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">PO Stage</label>
                        <Select
                          value={poStage}
                          onValueChange={(val) => updateStageMutation.mutate({ stage: val })}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {productionStages.map((s: any) => (
                              <SelectItem key={s.id} value={s.id}>
                                {s.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">PO Status</label>
                        <Select
                          value={poStatus}
                          onValueChange={(val) => updateStageMutation.mutate({ status: val })}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.values(PO_STATUSES).map((s) => (
                              <SelectItem key={s.key} value={s.key}>
                                {s.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Key Dates */}
                <Card>
                  <CardContent className="p-4 space-y-2">
                    <h4 className="text-sm font-semibold">Key Dates</h4>
                    <DateRow
                      icon={<Calendar className="h-3.5 w-3.5" />}
                      label="In-Hands Date"
                      date={po.in_hands_date}
                      showUrgency
                    />
                    <DateRow
                      icon={<Truck className="h-3.5 w-3.5" />}
                      label="Supplier In-Hands"
                      date={po.supplier_in_hands_date}
                    />
                    <DateRow
                      icon={<Clock className="h-3.5 w-3.5" />}
                      label="Event Date"
                      date={po.event_date}
                    />
                  </CardContent>
                </Card>

                {/* Next Action */}
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Next Action
                    </h4>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Action Type</label>
                      <Select
                        value={po.next_action_type || "no_action"}
                        onValueChange={(val) => updateNextActionMutation.mutate({ nextActionType: val })}
                      >
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {actionTypes.map((t) => (
                            <SelectItem key={t.id} value={t.id}>
                              <span className="flex items-center gap-2">
                                <span className={`inline-block w-2 h-2 rounded-full ${t.color.split(' ')[0]}`} />
                                {t.name}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Action Date</label>
                      <Input
                        type="date"
                        className="h-8 text-sm"
                        value={po.next_action_date ? format(new Date(po.next_action_date), "yyyy-MM-dd") : ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateNextActionMutation.mutate({
                            nextActionDate: val || null,
                          });
                        }}
                      />
                      {po.next_action_date && (() => {
                        const status = getDateStatus(po.next_action_date);
                        return status && status.urgency !== "normal" ? (
                          <Badge className={`text-[10px] px-1.5 py-0 mt-1 ${status.color} border-0`}>
                            {status.label}
                          </Badge>
                        ) : null;
                      })()}
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Notes</label>
                      <Textarea
                        className="text-sm min-h-[60px]"
                        placeholder="Follow-up notes..."
                        defaultValue={po.next_action_notes || ""}
                        onBlur={(e) => {
                          if (e.target.value !== (po.next_action_notes || "")) {
                            updateNextActionMutation.mutate({ nextActionNotes: e.target.value });
                          }
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Order Info */}
                <Card>
                  <CardContent className="p-4 space-y-2">
                    <h4 className="text-sm font-semibold">Order Info</h4>
                    <InfoRow icon={<FileText className="h-3.5 w-3.5" />} label="Order" value={`#${po.order_number}`} />
                    <InfoRow icon={<Building2 className="h-3.5 w-3.5" />} label="Company" value={po.company_name} />
                    <InfoRow icon={<Package className="h-3.5 w-3.5" />} label="Vendor" value={po.vendor_name || po.supplier_name} />
                    <InfoRow icon={<User className="h-3.5 w-3.5" />} label="Assigned To" value={po.assigned_user_name} />
                    <InfoRow icon={<User className="h-3.5 w-3.5" />} label="CSR" value={po.csr_user_name} />
                    {(po.is_firm || po.is_rush) && (
                      <div className="flex gap-2 pt-1">
                        {po.is_firm && <Badge className="bg-blue-100 text-blue-800 border-0 text-xs">FIRM</Badge>}
                        {po.is_rush && <Badge className="bg-red-100 text-red-800 border-0 text-xs">RUSH</Badge>}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Vendor Contact */}
                {(po.supplier_email || po.supplier_phone || po.supplier_contact) && (
                  <Card>
                    <CardContent className="p-4 space-y-2">
                      <h4 className="text-sm font-semibold">Vendor Contact</h4>
                      {po.supplier_contact && (
                        <InfoRow icon={<User className="h-3.5 w-3.5" />} label="Contact" value={po.supplier_contact} />
                      )}
                      {po.supplier_email && (
                        <InfoRow icon={<Mail className="h-3.5 w-3.5" />} label="Email" value={po.supplier_email} />
                      )}
                      {po.supplier_phone && (
                        <InfoRow icon={<Phone className="h-3.5 w-3.5" />} label="Phone" value={po.supplier_phone} />
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Recent Activity */}
                {po.activities?.length > 0 && (
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="text-sm font-semibold mb-2">Recent Activity</h4>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {po.activities.slice(0, 10).map((act: any, i: number) => (
                          <div key={i} className="flex items-start gap-2 text-xs">
                            <span className="text-muted-foreground whitespace-nowrap">
                              {act.created_at ? format(new Date(act.created_at), "MMM d, h:mm a") : ""}
                            </span>
                            <span className="text-foreground">
                              {act.user_name && <strong>{act.user_name}: </strong>}
                              {act.content || act.activity_type}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* ── Proofing Tab ── */}
              <TabsContent value="proofing" className="space-y-4 mt-4">
                {(!po.artworkItems || po.artworkItems.length === 0) ? (
                  <div className="text-center text-muted-foreground py-8">
                    <Palette className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No artwork items for this vendor</p>
                  </div>
                ) : (
                  po.artworkItems.map((item: any, idx: number) => (
                    <Card key={idx}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">{item.name}</span>
                          <Badge className={getProofStatusBadgeClass(item.status)}>
                            {PROOF_STATUSES[item.status]?.label || item.status}
                          </Badge>
                        </div>
                        {item.artwork_type && (
                          <p className="text-xs text-muted-foreground">Type: {item.artwork_type}</p>
                        )}
                        {item.location && (
                          <p className="text-xs text-muted-foreground">Location: {item.location}</p>
                        )}
                        {item.proofFilePath && (
                          <Button
                            size="sm"
                            variant="link"
                            className="px-0 h-auto text-xs"
                            onClick={() => setPreviewFile({
                              originalName: item.proofFileName || item.name || "Proof",
                              filePath: item.proofFilePath,
                              mimeType: item.proofFilePath?.match(/\.(png|jpg|jpeg|gif|webp)$/i) ? "image/png" : "application/pdf",
                              fileName: item.proofFileName || "proof",
                            })}
                          >
                            View Proof File
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
                <p className="text-xs text-muted-foreground text-center">
                  Full proofing actions available in the{" "}
                  <button
                    className="text-primary underline"
                    onClick={() => setLocation(`/project/${po.order_id}`)}
                  >
                    PO section
                  </button>
                </p>
              </TabsContent>

              {/* ── Shipping Tab ── */}
              <TabsContent value="shipping" className="space-y-4 mt-4">
                {/* Date context */}
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-3">
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-blue-600 font-medium">In-Hands</span>
                        <p className="text-blue-800">
                          {po.in_hands_date ? format(new Date(po.in_hands_date), "MMM d, yyyy") : "Not set"}
                        </p>
                      </div>
                      <div>
                        <span className="text-blue-600 font-medium">Supplier IHD</span>
                        <p className="text-blue-800">
                          {po.supplier_in_hands_date ? format(new Date(po.supplier_in_hands_date), "MMM d, yyyy") : "Not set"}
                        </p>
                      </div>
                      <div>
                        <span className="text-blue-600 font-medium">Event Date</span>
                        <p className="text-blue-800">
                          {po.event_date ? format(new Date(po.event_date), "MMM d, yyyy") : "Not set"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {(!po.shipments || po.shipments.length === 0) ? (
                  <div className="text-center text-muted-foreground py-8">
                    <Truck className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No shipments recorded yet</p>
                  </div>
                ) : (
                  po.shipments.map((ship: any, idx: number) => (
                    <Card key={idx}>
                      <CardContent className="p-4 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">
                            {ship.carrier || "Unknown Carrier"}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {ship.status || "pending"}
                          </Badge>
                        </div>
                        {ship.trackingNumber && (
                          <p className="text-xs text-muted-foreground">
                            Tracking: <span className="font-mono">{ship.trackingNumber}</span>
                          </p>
                        )}
                        {ship.shipDate && (
                          <p className="text-xs text-muted-foreground">
                            Shipped: {format(new Date(ship.shipDate), "MMM d, yyyy")}
                          </p>
                        )}
                        {ship.estimatedDelivery && (
                          <p className="text-xs text-muted-foreground">
                            Est. Delivery: {format(new Date(ship.estimatedDelivery), "MMM d, yyyy")}
                          </p>
                        )}
                        {ship.actualDelivery && (
                          <p className="text-xs text-green-600 flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Delivered: {format(new Date(ship.actualDelivery), "MMM d, yyyy")}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              {/* ── Details Tab ── */}
              <TabsContent value="details" className="space-y-4 mt-4">
                {/* Line Items */}
                <Card>
                  <CardContent className="p-4">
                    <h4 className="text-sm font-semibold mb-2">
                      Line Items ({po.items?.length || 0})
                    </h4>
                    {po.items?.length > 0 ? (
                      <div className="space-y-2">
                        {po.items.map((item: any, idx: number) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between py-1.5 border-b last:border-0 text-sm"
                          >
                            <div>
                              <p className="font-medium">{item.product_name || "Product"}</p>
                              {item.product_sku && (
                                <p className="text-xs text-muted-foreground">SKU: {item.product_sku}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <p>Qty: {item.quantity || 0}</p>
                              {item.unit_cost && (
                                <p className="text-xs text-muted-foreground">
                                  ${parseFloat(item.unit_cost).toFixed(2)} ea
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No items found</p>
                    )}
                  </CardContent>
                </Card>

                {/* Addresses */}
                {(po.shipping_address || po.billing_address) && (
                  <Card>
                    <CardContent className="p-4 space-y-3">
                      {po.shipping_address && (
                        <div>
                          <h4 className="text-sm font-semibold flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" /> Shipping Address
                          </h4>
                          <p className="text-xs text-muted-foreground whitespace-pre-line mt-1">
                            {po.shipping_address}
                          </p>
                        </div>
                      )}
                      {po.billing_address && (
                        <div>
                          <h4 className="text-sm font-semibold flex items-center gap-1">
                            <Building2 className="h-3.5 w-3.5" /> Billing Address
                          </h4>
                          <p className="text-xs text-muted-foreground whitespace-pre-line mt-1">
                            {po.billing_address}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Payment & Notes */}
                <Card>
                  <CardContent className="p-4 space-y-2">
                    {po.payment_terms && (
                      <InfoRow icon={<FileText className="h-3.5 w-3.5" />} label="Terms" value={po.payment_terms} />
                    )}
                    {po.totalCost > 0 && (
                      <InfoRow
                        icon={<Package className="h-3.5 w-3.5" />}
                        label="Total Cost"
                        value={`$${Number(po.totalCost).toFixed(2)}`}
                      />
                    )}
                    {po.supplier_notes && (
                      <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground font-medium">Supplier Notes</p>
                        <p className="text-xs mt-1">{po.supplier_notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </SheetContent>

      {/* File Preview Modal */}
      <FilePreviewModal
        open={!!previewFile}
        onClose={() => setPreviewFile(null)}
        file={previewFile}
      />
    </Sheet>
  );
}

// ── Helper Components ──

function DateRow({
  icon,
  label,
  date,
  showUrgency,
}: {
  icon: React.ReactNode;
  label: string;
  date?: string | null;
  showUrgency?: boolean;
}) {
  const formatted = date ? format(new Date(date), "MMM d, yyyy") : "Not set";
  const dateStatus = showUrgency && date ? getDateStatus(date) : null;

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">{icon}</span>
      <span className="text-muted-foreground text-xs w-28">{label}</span>
      <span className="text-xs font-medium">{formatted}</span>
      {dateStatus && dateStatus.urgency !== "normal" && (
        <Badge className={`text-[10px] px-1.5 py-0 ${dateStatus.color} border-0`}>
          {dateStatus.label}
        </Badge>
      )}
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string | null;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">{icon}</span>
      <span className="text-muted-foreground text-xs w-28">{label}</span>
      <span className="text-xs font-medium">{value || "—"}</span>
    </div>
  );
}
