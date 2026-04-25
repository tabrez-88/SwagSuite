import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Eye,
  EyeOff,
  ArrowRight,
  Package,
  Plus,
  Send,
} from "lucide-react";
import { format } from "date-fns";
import StageConversionDialog from "../../components/StageConversionDialog";
import SendPresentationDialog from "@/components/modals/SendPresentationDialog";
import { usePresentationSection, presentationStatuses } from "./hooks";
import ProductPricingEditor from "./components/ProductPricingEditor";
import ProductPreviewLightbox from "./components/ProductPreviewLightbox";
import ArtworkGrid from "./components/ArtworkGrid";
import PresentationDetailsCard from "./components/PresentationDetailsCard";
import PresentationEditDialog from "./components/PresentationEditDialog";
import GridView from "./components/GridView";
import DetailedView from "./components/DetailedView";
import type { PresentationSectionProps } from "./types";

export default function PresentationSection(props: PresentationSectionProps) {
  const { projectId } = props;
  const hook = usePresentationSection(props);
  const [showEditDialog, setShowEditDialog] = useState(false);

  if (!hook.order) return null;

  const selectedContactObj = hook.contacts?.find((c) => c.id === hook.selectedContact);

  return (
    <div className="space-y-6">
      {/* Top Info Bar */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Status</label>
            <Select value={hook.currentStatus} onValueChange={(val) => hook.updateStatusMutation.mutate(val)}>
              <SelectTrigger className="min-w-[140px] h-9">
                <SelectValue>
                  <span className="flex items-center text-nowrap gap-2">
                    <span className={`inline-block w-2 h-2 rounded-full ${hook.statusInfo.color.split(" ")[0]}`} />
                    {hook.statusInfo.label}
                  </span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {presentationStatuses.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    <span className="flex items-center gap-2">
                      <span className={`inline-block w-2 h-2 rounded-full ${s.color.split(" ")[0]}`} />
                      {s.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Presentation Date</label>
            <span className="text-sm font-medium">{hook.presentationDate ? format(new Date(hook.presentationDate + "T00:00:00"), "MMM d, yyyy") : "—"}</span>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">In Hands Date</label>
            <span className="text-sm font-medium">{hook.order.inHandsDate ? format(new Date(hook.order.inHandsDate), "MMM d, yyyy") : "—"}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1" onClick={() => hook.setLocation(`/projects/${projectId}/presentation/preview`)}>
            <Eye className="w-4 h-4" />
            Preview
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={() => hook.shareLinkMutation.mutate()}
            disabled={hook.shareLinkMutation.isPending}
          >
            <ExternalLink className="w-4 h-4" />
            {hook.shareLinkMutation.isPending ? "Generating..." : "Open Link"}
          </Button>
          <Button size="sm" className="gap-1" onClick={() => hook.setShowSendDialog(true)}>
            <Send className="w-4 h-4" />
            Send to Client
          </Button>
          <Button variant="ghost" size="sm" onClick={() => hook.setIsInfoCollapsed(!hook.isInfoCollapsed)}>
            {hook.isInfoCollapsed ? <><ChevronDown className="w-4 h-4 mr-1" />Expand Info</> : <><ChevronUp className="w-4 h-4 mr-1" />Collapse Info</>}
          </Button>
        </div>
      </div>

      {/* Stage Conversion Banner */}
      {hook.data.businessStage?.stage.id === "presentation" && (
        <div className="flex items-center justify-between bg-gradient-to-r from-teal-50 to-blue-50 border border-teal-200 rounded-lg px-5 py-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Ready to move forward?</h3>
            <p className="text-xs text-gray-500 mt-0.5">Convert this presentation to a quote or skip directly to a sales order.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 border-amber-300 text-amber-700 hover:bg-amber-50 hover:text-amber-700"
              onClick={() => hook.setConversionTarget("quote")}
            >
              <ArrowRight className="w-4 h-4" />
              Convert to Quote
            </Button>
            <Button
              size="sm"
              className="gap-1.5 bg-primary hover:bg-sidebar-primary"
              onClick={() => hook.setConversionTarget("sales_order")}
            >
              <ArrowRight className="w-4 h-4" />
              Convert to Sales Order
            </Button>
          </div>
        </div>
      )}

      {/* Collapsible Info Section */}
      {!hook.isInfoCollapsed && (
        <PresentationDetailsCard
          introduction={hook.introduction}
          selectedContactName={selectedContactObj ? `${selectedContactObj.firstName}` : ""}
          expiryDate={hook.expiryDate}
          currency={hook.currency}
          hidePricing={hook.hidePricing}
          onEditClick={() => setShowEditDialog(true)}
        />
      )}

      {/* Presentation Edit Dialog */}
      <PresentationEditDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        hook={hook}
        projectId={projectId}
      />

      {/* Products Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex border rounded-md overflow-hidden">
          <Button variant={hook.viewMode === "detailed" ? "default" : "ghost"} size="sm" className="rounded-none px-3 h-8" onClick={() => hook.setViewMode("detailed")}>Detailed</Button>
          <Button variant={hook.viewMode === "grid" ? "default" : "ghost"} size="sm" className="rounded-none px-3 h-8" onClick={() => hook.setViewMode("grid")}>Grid</Button>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => { hook.setLocation(`/projects/${projectId}/presentation/add`); }} size="sm" className="gap-1 text-white" style={{ backgroundColor: hook.primaryColor }}>
            <Plus className="w-4 h-4" />Product From Database
          </Button>
          {hook.hiddenCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-xs"
              onClick={() => hook.setShowHidden(!hook.showHidden)}
            >
              {hook.showHidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              {hook.showHidden ? "Show Active Only" : `Show All (${hook.hiddenCount} hidden)`}
            </Button>
          )}
        </div>
      </div>

      {/* Products */}
      {hook.enrichedItems.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products yet</h3>
            <p className="text-gray-500 mb-4">Add products from the database or get AI recommendations</p>
            <Button variant="outline" onClick={() => hook.setLocation(`/projects/${projectId}/presentation/add`)}>
              <Plus className="w-4 h-4 mr-2" />Add Product
            </Button>
          </CardContent>
        </Card>
      ) : hook.viewMode === "grid" ? (
        <GridView items={hook.displayItems} hidePricing={hook.hidePricing} onPreview={hook.setPreviewItem} onToggleVisibility={hook.toggleItemVisibility} />
      ) : (
        <DetailedView items={hook.displayItems} hidePricing={hook.hidePricing} onEdit={hook.setEditingItem} onPreview={hook.setPreviewItem} onToggleVisibility={hook.toggleItemVisibility} onMoveItem={hook.moveItem} />
      )}

      {/* Artwork */}
      <ArtworkGrid data={hook.data} projectId={projectId} enrichedItems={hook.enrichedItems} />

      {/* Product Pricing Editor Dialog */}
      {hook.editingItem && (
        <ProductPricingEditor
          item={hook.editingItem}
          projectId={projectId}
          onClose={() => hook.setEditingItem(null)}
        />
      )}

      {/* Product Preview Lightbox */}
      {hook.previewItem && (
        <ProductPreviewLightbox
          item={hook.previewItem}
          projectId={projectId}
          companyName={hook.companyName}
          hidePricing={hook.hidePricing}
          comments={hook.productComments[hook.previewItem.id] || []}
          onClose={() => hook.setPreviewItem(null)}
        />
      )}

      {hook.conversionTarget && (
        <StageConversionDialog
          open={!!hook.conversionTarget}
          onOpenChange={(open) => !open && hook.setConversionTarget(null)}
          targetStage={hook.conversionTarget}
          projectId={projectId}
          enrichedItems={hook.enrichedItems}
          onSuccess={hook.handleConversionSuccess}
        />
      )}

      {hook.showSendDialog && (
        <SendPresentationDialog
          open={hook.showSendDialog}
          onOpenChange={hook.setShowSendDialog}
          projectId={projectId}
          recipientEmail={hook.contactEmail}
          recipientName={hook.recipientName}
          companyName={hook.companyName}
          orderNumber={hook.order.orderNumber || ""}
          contacts={hook.formattedContacts}
          assignedUserEmail={props.data?.assignedUser?.email}
        />
      )}
    </div>
  );
}
