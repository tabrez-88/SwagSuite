import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChevronDown,
  ChevronUp,
  Copy as CopyIcon,
  Edit,
  Eye,
  EyeOff,
  Image,
  ArrowRight,
  Package,
  Palette,
  Plus,
  Send,
  Type,
  Upload,
} from "lucide-react";
import { format } from "date-fns";
import type { OrderItemLine } from "@shared/schema";
import StageConversionDialog from "../../components/StageConversionDialog";
import SendPresentationDialog from "@/components/modals/SendPresentationDialog";
import { usePresentationSection, presentationStatuses, calcMargin, marginColor } from "./hooks";
import ProductPricingEditor from "./ProductPricingEditor";
import ProductPreviewLightbox from "./ProductPreviewLightbox";
import ArtworkGrid from "./ArtworkGrid";
import type { PresentationSectionProps } from "./types";

export default function PresentationSection(props: PresentationSectionProps) {
  const { projectId } = props;
  const hook = usePresentationSection(props);

  if (!hook.order) return null;

  return (
    <div className="space-y-6">
      {/* Top Info Bar */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2 flex-wrap">
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
            <Input
              type="date"
              value={hook.presentationDate}
              onChange={(e) => hook.setPresentationDate(e.target.value)}
              onBlur={() => hook.saveSetting("presentationDate", hook.presentationDate)}
              className="w-[160px] h-9"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">In Hands Date</label>
            <Input
              type="date"
              defaultValue={hook.order.inHandsDate ? format(new Date(hook.order.inHandsDate), "yyyy-MM-dd") : ""}
              onBlur={hook.handleInHandsDateBlur}
              className="w-[160px] h-9"
            />
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
            <CopyIcon className="w-4 h-4" />
            {hook.shareLinkMutation.isPending ? "Generating..." : "Copy Link"}
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
        <Card>
          <CardContent className="pt-6 space-y-5">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Introduction</label>
              <Textarea
                value={hook.introduction}
                onChange={(e) => hook.setIntroduction(e.target.value)}
                onBlur={() => hook.saveSetting("introduction", hook.introduction)}
                placeholder="Add a message or introduction for this presentation..."
                className="min-h-[80px] resize-none"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Client Contact</label>
                <Select value={hook.selectedContact} onValueChange={(val) => { hook.setSelectedContact(val); hook.saveSetting("clientContactId", val); }}>
                  <SelectTrigger className="h-9 text-start "><SelectValue className="text-start" placeholder="Select contact" /></SelectTrigger>
                  <SelectContent>
                    {hook.contacts?.map((contact: any) => (
                      <SelectItem key={contact.id} value={contact.id}>{contact.firstName} | {contact.email}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Expiry Date</label>
                <Input
                  type="date"
                  value={hook.expiryDate}
                  onChange={(e) => hook.setExpiryDate(e.target.value)}
                  onBlur={() => hook.saveSetting("expiryDate", hook.expiryDate || null)}
                  className="h-9"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Currency</label>
                <Select value={hook.currency} onValueChange={(val) => { hook.setCurrency(val); hook.saveSetting("currency", val); }}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="CAD">CAD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 pb-1">
                <input type="checkbox" id="hidePricing" checked={hook.hidePricing} onChange={(e) => { hook.setHidePricing(e.target.checked); hook.saveSetting("hidePricing", e.target.checked); }} className="rounded border-gray-300" />
                <label htmlFor="hidePricing" className="text-sm text-gray-600">Hide Pricing</label>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Products / Artwork Tabs */}
      <Tabs defaultValue="products" className="w-full">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <TabsList>
            <TabsTrigger value="products" className="gap-1"><Package className="w-4 h-4" />Products</TabsTrigger>
            <TabsTrigger value="artwork" className="gap-1"><Palette className="w-4 h-4" />Artwork</TabsTrigger>
            {/* Design tab hidden - not yet functional */}
          </TabsList>
          <div className="flex border rounded-md overflow-hidden">
            <Button variant={hook.viewMode === "detailed" ? "default" : "ghost"} size="sm" className="rounded-none px-3 h-8" onClick={() => hook.setViewMode("detailed")}>Detailed</Button>
            <Button variant={hook.viewMode === "grid" ? "default" : "ghost"} size="sm" className="rounded-none px-3 h-8" onClick={() => hook.setViewMode("grid")}>Grid</Button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-3">
            <Button onClick={() => { hook.setLocation(`/projects/${projectId}/presentation/add`); }} size="sm" className="gap-1 text-white" style={{ backgroundColor: hook.primaryColor }}>
              <Plus className="w-4 h-4" />Product From Database
            </Button>
          </div>
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

        {/* Products Tab */}
        <TabsContent value="products" className="mt-4">
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
        </TabsContent>

        {/* Artwork Tab */}
        <TabsContent value="artwork" className="mt-4">
          <ArtworkGrid data={hook.data} projectId={projectId} enrichedItems={hook.enrichedItems} />
        </TabsContent>

        {/* Design Tab */}
        <TabsContent value="design" className="mt-4">
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Branding */}
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Image className="w-4 h-4" />
                    Branding
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-xs text-gray-500">Company Logo</Label>
                    <div className="mt-1 border-2 border-dashed rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer">
                      <Upload className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                      <p className="text-sm text-gray-500">Drop logo here or click to upload</p>
                      <p className="text-xs text-gray-400 mt-1">PNG, JPG, SVG up to 5MB</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Company Name</Label>
                    <Input defaultValue={(hook.companyData as any)?.name || hook.companyName} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Primary Color</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="color"
                        value={hook.primaryColor}
                        onChange={(e) => hook.setPrimaryColor(e.target.value)}
                        onBlur={() => hook.saveSetting("primaryColor", hook.primaryColor)}
                        className="w-10 h-10 rounded cursor-pointer border border-gray-200"
                      />
                      <Input
                        value={hook.primaryColor}
                        onChange={(e) => hook.setPrimaryColor(e.target.value)}
                        onBlur={() => hook.saveSetting("primaryColor", hook.primaryColor)}
                        className="w-28"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Layout & Typography */}
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Type className="w-4 h-4" />
                    Layout & Typography
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-xs text-gray-500">Header Style</Label>
                    <Select value={hook.headerStyle} onValueChange={(val) => { hook.setHeaderStyle(val); hook.saveSetting("headerStyle", val); }}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="banner">Banner with Logo</SelectItem>
                        <SelectItem value="minimal">Minimal</SelectItem>
                        <SelectItem value="centered">Centered</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Font Family</Label>
                    <Select value={hook.fontFamily} onValueChange={(val) => { hook.setFontFamily(val); hook.saveSetting("fontFamily", val); }}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">System Default</SelectItem>
                        <SelectItem value="inter">Inter</SelectItem>
                        <SelectItem value="roboto">Roboto</SelectItem>
                        <SelectItem value="poppins">Poppins</SelectItem>
                        <SelectItem value="playfair">Playfair Display</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Footer Text</Label>
                    <Textarea
                      value={hook.footerText}
                      onChange={(e) => hook.setFooterText(e.target.value)}
                      onBlur={() => hook.saveSetting("footerText", hook.footerText)}
                      placeholder="Custom footer message (e.g., Thank you for your business!)"
                      className="mt-1 min-h-[60px] resize-none"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Live Preview */}
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm">Live Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="rounded-lg overflow-hidden border"
                  style={{ backgroundColor: hook.primaryColor }}
                >
                  <div className="px-6 py-4 text-white">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                        <Image className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold">{(hook.companyData as any)?.name || hook.companyName}</h3>
                        <p className="text-white/80 text-sm">Presentation for your project</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                      <Image className="w-8 h-8 text-gray-300" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

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
        />
      )}

    </div>
  );
}

// ── Grid View ──────────────────────────────────────────────────────
function GridView({ items, hidePricing, onPreview, onToggleVisibility }: {
  items: any[]; hidePricing: boolean; onPreview: (item: any) => void; onToggleVisibility: (id: string) => void;
}) {
  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
      {items.map((item: any) => (
        <Card key={item.id} className={`overflow-hidden hover:shadow-md transition-shadow group ${!item.isVisible ? "opacity-50" : ""}`}>
          <div className="aspect-square bg-gray-50 relative overflow-hidden cursor-pointer" onClick={() => onPreview(item)}>
            {item.imageUrl ? (
              <img src={item.imageUrl} alt={item.productName || "Product"} className="w-full h-full object-contain p-4" />
            ) : (
              <div className="w-full h-full flex items-center justify-center"><Package className="w-16 h-16 text-gray-200" /></div>
            )}
            {!item.isVisible && (
              <div className="absolute top-2 left-2">
                <Badge variant="secondary" className="text-xs bg-gray-800 text-white">Hidden</Badge>
              </div>
            )}
          </div>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <p className="font-medium text-sm truncate flex-1">{item.productName || "Unnamed Product"}</p>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 flex-shrink-0"
                onClick={(e) => { e.stopPropagation(); onToggleVisibility(item.id); }}
              >
                {item.isVisible ? <Eye className="w-3.5 h-3.5 text-gray-400" /> : <EyeOff className="w-3.5 h-3.5 text-red-400" />}
              </Button>
            </div>
            {item.productSku && <p className="text-xs text-gray-400">{item.productSku}</p>}
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-500">Qty: {item.quantity}</span>
              {!hidePricing && <span className="text-sm font-semibold">${Number(item.unitPrice || 0).toFixed(2)}</span>}
            </div>
            {item.colors && item.colors.length > 0 && (
              <div className="flex gap-1 mt-2 flex-wrap">
                {item.colors.slice(0, 8).map((color: string, idx: number) => (
                  <div key={idx} className="w-5 h-5 rounded-full border border-gray-200" style={{ backgroundColor: color.toLowerCase() }} title={color} />
                ))}
                {item.colors.length > 8 && <span className="text-xs text-gray-400 self-center">+{item.colors.length - 8}</span>}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── Detailed View (CommonSKU-style) ──────────────────────────────
function DetailedView({ items, hidePricing, onEdit, onPreview, onToggleVisibility, onMoveItem }: {
  items: any[]; hidePricing: boolean; onEdit: (item: any) => void; onPreview: (item: any) => void; onToggleVisibility: (id: string) => void; onMoveItem: (id: string, dir: "up" | "down") => void;
}) {
  return (
    <div className="space-y-0 border rounded-lg overflow-hidden">
      {/* Table Header */}
      <div className="grid grid-cols-[36px_1fr_100px_100px_100px] gap-2 px-4 py-2 bg-gray-50 border-b text-xs font-semibold text-gray-500 uppercase">
        <span />
        <span>Item</span>
        <span className="text-right">Units</span>
        <span className="text-right">Margin</span>
        <span className="text-right">Amount</span>
      </div>

      {items.map((item: any, idx: number) => {
        const lines: OrderItemLine[] = item.lines || [];
        const hasLines = lines.length > 0;
        const cost = Number(item.cost || 0);
        const price = Number(item.unitPrice || 0);
        const itemMargin = calcMargin(cost, price);

        return (
          <div key={item.id} className={`border-b last:border-b-0 bg-white ${!item.isVisible ? "opacity-50" : ""}`}>
            {/* Main product row */}
            <div className="grid grid-cols-[36px_1fr_100px_100px_100px] gap-2 px-4 py-3 items-center">
              {/* Reorder + Visibility controls */}
              <div className="flex flex-col items-center gap-0.5 pt-1">
                <button
                  onClick={() => onMoveItem(item.id, "up")}
                  disabled={idx === 0}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onToggleVisibility(item.id)}
                  className="text-gray-400 hover:text-gray-600"
                  title={item.isVisible ? "Hide from client" : "Show to client"}
                >
                  {item.isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-red-400" />}
                </button>
                <button
                  onClick={() => onMoveItem(item.id, "down")}
                  disabled={idx === items.length - 1}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Product Info */}
              <div className="flex gap-3 items-center">
                {/* Thumbnail */}
                <div className="w-16 h-16 flex items-center flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden cursor-pointer relative" onClick={() => onPreview(item)}>
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.productName || ""} className="w-full h-full object-contain p-1" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><Package className="w-6 h-6 text-gray-300" /></div>
                  )}
                  {!item.isVisible && (
                    <div className="absolute inset-0 bg-gray-800/30 flex items-center justify-center">
                      <EyeOff className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  {item.productSku && <p className="text-xs text-gray-400">{item.productSku}</p>}
                  <p className="text-xs text-teal-600">{item.supplierName || "Unknown Supplier"}</p>
                  <p className="text-sm font-medium cursor-pointer hover:text-teal-700" onClick={() => onPreview(item)}>
                    {item.productName || "Unnamed Product"}
                    {!item.isVisible && <span className="text-xs text-red-400 ml-2">(Hidden)</span>}
                  </p>
                  {/* Action buttons */}
                  <div className="flex gap-1 mt-1.5">
                    <Button size="sm" variant="default" className="h-8 px-2 font-semibold text-xs bg-secondary text-primary" onClick={() => onEdit(item)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="default" className="h-8 px-2 font-semibold text-xs bg-primary" onClick={() => onPreview(item)}>
                      View
                    </Button>
                  </div>
                </div>
              </div>
              {/* If no item lines, show the item-level pricing */}
              {!hasLines ? (
                <>
                  <span className="text-sm text-right">{item.quantity}</span>
                  <span className={`text-sm text-right font-medium ${marginColor(itemMargin)}`}>
                    {hidePricing ? "\u2014" : `${itemMargin.toFixed(2)}%`}
                  </span>
                  <span className="text-sm text-right font-semibold">
                    {hidePricing ? "\u2014" : `$${price.toFixed(2)}`}
                  </span>
                </>
              ) : (
                <><span /><span /><span /></>
              )}
            </div>

            {/* Item Lines (pricing tiers) */}
            {hasLines && (
              <div className="px-4 pb-3">
                {lines.map((line: OrderItemLine) => {
                  const lineCost = Number(line.cost || 0);
                  const linePrice = Number(line.unitPrice || 0);
                  const lineMargin = calcMargin(lineCost, linePrice);
                  return (
                    <div key={line.id} className="grid grid-cols-[36px_1fr_100px_100px_100px] gap-2 py-1">
                      <span /><span />
                      <span className="text-sm text-right">{line.quantity}</span>
                      <span className={`text-sm text-right font-medium ${marginColor(lineMargin)}`}>
                        {hidePricing ? "\u2014" : `${lineMargin.toFixed(2)}%`}
                      </span>
                      <span className="text-sm text-right font-semibold">
                        {hidePricing ? "\u2014" : `$${linePrice.toFixed(2)}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Product description (expandable) */}
            {item.description && (
              <div className="px-4 pb-3">
                <p className="text-sm text-gray-500 line-clamp-3">{item.description}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
