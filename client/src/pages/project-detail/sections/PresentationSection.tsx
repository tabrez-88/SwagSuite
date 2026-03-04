import { useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  MapPin,
  Package,
  Paintbrush,
  Palette,
  Plus,
  Send,
  Trash2,
  Type,
  Upload,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { OrderItemLine } from "@shared/schema";
import type { useProjectData } from "../hooks/useProjectData";
import StageConversionDialog from "../components/StageConversionDialog";

interface PresentationSectionProps {
  orderId: string;
  data: ReturnType<typeof useProjectData>;
}

type ViewMode = "detailed" | "grid";

const presentationStatuses = [
  { value: "draft", label: "Draft", color: "bg-gray-100 text-gray-800" },
  { value: "open", label: "Open", color: "bg-blue-100 text-blue-800" },
  { value: "sent", label: "Sent", color: "bg-purple-100 text-purple-800" },
  { value: "viewed", label: "Viewed", color: "bg-green-100 text-green-800" },
  { value: "expired", label: "Expired", color: "bg-red-100 text-red-800" },
];

const calcMargin = (cost: number, price: number) =>
  price > 0 ? ((price - cost) / price) * 100 : 0;

const marginColor = (m: number) =>
  m >= 30 ? "text-green-600" : m >= 15 ? "text-yellow-600" : "text-red-600";

export default function PresentationSection({ orderId, data }: PresentationSectionProps) {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { order, orderItems, companyName, companyData, primaryContact, contacts, allProducts, allItemLines, allItemCharges } = data;

  const currentStatus = (order as any)?.presentationStatus || "draft";
  const statusInfo = presentationStatuses.find((s) => s.value === currentStatus) || presentationStatuses[0];

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      await apiRequest("PATCH", `/api/orders/${orderId}`, { presentationStatus: newStatus });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}`] }),
    onError: () => toast({ title: "Failed to update status", variant: "destructive" }),
  });

  const [isInfoCollapsed, setIsInfoCollapsed] = useState(false);
  const [introduction, setIntroduction] = useState((order as any)?.notes || "");
  const [hidePricing, setHidePricing] = useState(false);
  const [conversionTarget, setConversionTarget] = useState<"estimate" | "sales_order" | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("detailed");
  const [selectedContact, setSelectedContact] = useState(primaryContact?.id || "");
  const [editingItem, setEditingItem] = useState<any>(null);
  const [previewItem, setPreviewItem] = useState<any>(null);

  // Design tab state
  const [primaryColor, setPrimaryColor] = useState("#0f766e");
  const [headerStyle, setHeaderStyle] = useState("banner");
  const [fontFamily, setFontFamily] = useState("default");

  // Enrich order items with product data
  const enrichedItems = useMemo(() => {
    return orderItems.map((item: any) => {
      const product = allProducts.find((p: any) => p.id === item.productId);
      const lines = allItemLines?.[item.id] || [];
      const charges = allItemCharges?.[item.id] || [];
      return {
        ...item,
        imageUrl: item.productImageUrl || product?.imageUrl || null,
        colors: item.productColors || product?.colors || [],
        sizes: item.productSizes || product?.sizes || [],
        brand: item.productBrand || product?.brand || null,
        description: item.productDescription || product?.description || null,
        lines,
        charges,
      };
    });
  }, [orderItems, allProducts, allItemLines, allItemCharges]);

  if (!order) return null;

  const contactEmail = contacts?.find((c: any) => c.id === selectedContact)?.email || primaryContact?.email || "";

  return (
    <div className="space-y-6">
      {/* Top Info Bar */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-6 flex-wrap">
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Status</label>
            <Select value={currentStatus} onValueChange={(val) => updateStatusMutation.mutate(val)}>
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue>
                  <span className="flex items-center gap-2">
                    <span className={`inline-block w-2 h-2 rounded-full ${statusInfo.color.split(" ")[0]}`} />
                    {statusInfo.label}
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
            <Input type="date" defaultValue={order.createdAt ? format(new Date(order.createdAt), "yyyy-MM-dd") : ""} className="w-[160px] h-9" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">In Hands Date</label>
            <Input type="date" defaultValue={order.inHandsDate ? format(new Date(order.inHandsDate), "yyyy-MM-dd") : ""} className="w-[160px] h-9" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1" onClick={() => setLocation(`/project/${orderId}/presentation/preview`)}>
            <Eye className="w-4 h-4" />
            Preview
          </Button>
          <Button variant="outline" size="sm" className="gap-1">
            <CopyIcon className="w-4 h-4" />
            Copy Link
          </Button>
          <Button size="sm" className="gap-1">
            <Send className="w-4 h-4" />
            Send to Client
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setIsInfoCollapsed(!isInfoCollapsed)}>
            {isInfoCollapsed ? <><ChevronDown className="w-4 h-4 mr-1" />Expand Info</> : <><ChevronUp className="w-4 h-4 mr-1" />Collapse Info</>}
          </Button>
        </div>
      </div>

      {/* Stage Conversion Banner */}
      {data.businessStage?.stage.id === "presentation" && (
        <div className="flex items-center justify-between bg-gradient-to-r from-teal-50 to-blue-50 border border-teal-200 rounded-lg px-5 py-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Ready to move forward?</h3>
            <p className="text-xs text-gray-500 mt-0.5">Convert this presentation to an estimate or skip directly to a sales order.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 border-amber-300 text-amber-700 hover:bg-amber-50 hover:text-amber-700"
              onClick={() => setConversionTarget("estimate")}
            >
              <ArrowRight className="w-4 h-4" />
              Convert to Estimate
            </Button>
            <Button
              size="sm"
              className="gap-1.5 bg-primary hover:bg-sidebar-primary"
              onClick={() => setConversionTarget("sales_order")}
            >
              <ArrowRight className="w-4 h-4" />
              Convert to Sales Order
            </Button>
          </div>
        </div>
      )}

      {/* Collapsible Info Section */}
      {!isInfoCollapsed && (
        <Card>
          <CardContent className="pt-6 space-y-5">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Introduction</label>
              <Textarea value={introduction} onChange={(e) => setIntroduction(e.target.value)} placeholder="Add a message or introduction for this presentation..." className="min-h-[80px] resize-none" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Client Contact</label>
                <Select value={selectedContact} onValueChange={setSelectedContact}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Select contact" /></SelectTrigger>
                  <SelectContent>
                    {contacts?.map((contact: any) => (
                      <SelectItem key={contact.id} value={contact.id}>{contact.firstName} {contact.lastName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {contactEmail && <p className="text-xs text-gray-400 mt-1">{contactEmail}</p>}
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Expiry Date</label>
                <Input type="date" className="h-9" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Currency</label>
                <Select defaultValue="USD">
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="CAD">CAD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 pb-1">
                <input type="checkbox" id="hidePricing" checked={hidePricing} onChange={(e) => setHidePricing(e.target.checked)} className="rounded border-gray-300" />
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
            <TabsTrigger value="design" className="gap-1"><Paintbrush className="w-4 h-4" />Design</TabsTrigger>
          </TabsList>
          <div className="flex border rounded-md overflow-hidden">
            <Button variant={viewMode === "detailed" ? "default" : "ghost"} size="sm" className="rounded-none px-3 h-8" onClick={() => setViewMode("detailed")}>Detailed</Button>
            <Button variant={viewMode === "grid" ? "default" : "ghost"} size="sm" className="rounded-none px-3 h-8" onClick={() => setViewMode("grid")}>Grid</Button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 mt-4">
          <Button onClick={() => { setLocation(`/project/${orderId}/sales-order/add`); }} size="sm" className="bg-emerald-600 hover:bg-emerald-700 gap-1">
            <Plus className="w-4 h-4" />Product From Database
          </Button>
        </div>

        {/* Products Tab */}
        <TabsContent value="products" className="mt-4">
          {enrichedItems.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Package className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No products yet</h3>
                <p className="text-gray-500 mb-4">Add products from the database or get AI recommendations</p>
                <Button variant="outline" onClick={() => setLocation(`/project/${orderId}/sales-order/add`)}>
                  <Plus className="w-4 h-4 mr-2" />Add Product
                </Button>
              </CardContent>
            </Card>
          ) : viewMode === "grid" ? (
            <GridView items={enrichedItems} hidePricing={hidePricing} onPreview={setPreviewItem} />
          ) : (
            <DetailedView items={enrichedItems} hidePricing={hidePricing} onEdit={setEditingItem} onPreview={setPreviewItem} />
          )}
        </TabsContent>

        {/* Artwork Tab */}
        <TabsContent value="artwork" className="mt-4">
          <ArtworkGrid data={data} />
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
                    <Input defaultValue={(companyData as any)?.name || companyName} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Primary Color</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="w-10 h-10 rounded cursor-pointer border border-gray-200"
                      />
                      <Input
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
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
                    <Select value={headerStyle} onValueChange={setHeaderStyle}>
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
                    <Select value={fontFamily} onValueChange={setFontFamily}>
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
                  style={{ backgroundColor: primaryColor }}
                >
                  <div className="px-6 py-4 text-white">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                        <Image className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold">{(companyData as any)?.name || companyName}</h3>
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
      {editingItem && (
        <ProductPricingEditor
          item={editingItem}
          orderId={orderId}
          onClose={() => setEditingItem(null)}
        />
      )}

      {/* Product Preview Lightbox */}
      {previewItem && (
        <ProductPreviewLightbox
          item={previewItem}
          companyName={companyName}
          hidePricing={hidePricing}
          onClose={() => setPreviewItem(null)}
        />
      )}

      {conversionTarget && (
        <StageConversionDialog
          open={!!conversionTarget}
          onOpenChange={(open) => !open && setConversionTarget(null)}
          targetStage={conversionTarget}
          orderId={orderId}
          enrichedItems={enrichedItems}
          onSuccess={() => {
            setConversionTarget(null);
            queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}`] });
            queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}/items`] });
          }}
        />
      )}

    </div>
  );
}

// ── Grid View ──────────────────────────────────────────────────────
function GridView({ items, hidePricing, onPreview }: {
  items: any[]; hidePricing: boolean; onPreview: (item: any) => void;
}) {
  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
      {items.map((item: any) => (
        <Card key={item.id} className="overflow-hidden hover:shadow-md transition-shadow group cursor-pointer" onClick={() => onPreview(item)}>
          <div className="aspect-square bg-gray-50 relative overflow-hidden">
            {item.imageUrl ? (
              <img src={item.imageUrl} alt={item.productName || "Product"} className="w-full h-full object-contain p-4" />
            ) : (
              <div className="w-full h-full flex items-center justify-center"><Package className="w-16 h-16 text-gray-200" /></div>
            )}
          </div>
          <CardContent className="p-3">
            <p className="font-medium text-sm truncate">{item.productName || "Unnamed Product"}</p>
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
function DetailedView({ items, hidePricing, onEdit, onPreview }: {
  items: any[]; hidePricing: boolean; onEdit: (item: any) => void; onPreview: (item: any) => void;
}) {
  return (
    <div className="space-y-0 border rounded-lg overflow-hidden">
      {/* Table Header */}
      <div className="grid grid-cols-[1fr_100px_100px_100px] gap-2 px-4 py-2 bg-gray-50 border-b text-xs font-semibold text-gray-500 uppercase">
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
          <div key={item.id} className={`border-b last:border-b-0 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
            {/* Main product row */}
            <div className="grid grid-cols-[1fr_100px_100px_100px] gap-2 px-4 py-3 items-start">
              {/* Product Info */}
              <div className="flex gap-3">
                {/* Thumbnail */}
                <div className="w-16 h-16 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden cursor-pointer" onClick={() => onPreview(item)}>
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.productName || ""} className="w-full h-full object-contain p-1" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><Package className="w-6 h-6 text-gray-300" /></div>
                  )}
                </div>
                <div className="min-w-0">
                  {item.productSku && <p className="text-xs text-gray-400">{item.productSku}</p>}
                  <p className="text-xs text-teal-600">{item.supplierName || "Unknown Supplier"}</p>
                  <p className="text-sm font-medium cursor-pointer hover:text-teal-700" onClick={() => onPreview(item)}>
                    {item.productName || "Unnamed Product"}
                  </p>
                  {/* Action buttons */}
                  <div className="flex gap-1 mt-1.5">
                    <Button size="sm" variant="default" className="h-6 px-2 text-xs bg-teal-600 hover:bg-teal-700" onClick={() => onEdit(item)}>
                      edit
                    </Button>
                    <Button size="sm" variant="default" className="h-6 px-2 text-xs bg-blue-600 hover:bg-blue-700" onClick={() => onPreview(item)}>
                      view
                    </Button>
                  </div>
                </div>
              </div>

              {/* If no item lines, show the item-level pricing */}
              {!hasLines ? (
                <>
                  <span className="text-sm text-right">{item.quantity}</span>
                  <span className={`text-sm text-right font-medium ${marginColor(itemMargin)}`}>
                    {hidePricing ? "—" : `${itemMargin.toFixed(2)}%`}
                  </span>
                  <span className="text-sm text-right font-semibold">
                    {hidePricing ? "—" : `$${price.toFixed(2)}`}
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
                    <div key={line.id} className="grid grid-cols-[1fr_100px_100px_100px] gap-2 py-1">
                      <span />
                      <span className="text-sm text-right">{line.quantity}</span>
                      <span className={`text-sm text-right font-medium ${marginColor(lineMargin)}`}>
                        {hidePricing ? "—" : `${lineMargin.toFixed(2)}%`}
                      </span>
                      <span className="text-sm text-right font-semibold">
                        {hidePricing ? "—" : `$${linePrice.toFixed(2)}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Product description (expandable) */}
            {item.description && (
              <div className="px-4 pb-3 ml-[76px]">
                <p className="text-sm text-gray-500 line-clamp-3">{item.description}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Product Pricing Editor Dialog (CommonSKU-style Horizontal Layout) ──
function ProductPricingEditor({ item, orderId, onClose }: {
  item: any; orderId: string; onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const lines: OrderItemLine[] = item.lines || [];

  const [priceLabel, setPriceLabel] = useState(item.priceLabel || "");
  const [personalComment, setPersonalComment] = useState(item.personalComment || "");
  const [privateNotes, setPrivateNotes] = useState(item.privateNotes || "");
  const [imprintLocation, setImprintLocation] = useState(item.imprintLocation || "");
  const [imprintMethod, setImprintMethod] = useState(item.imprintMethod || "");
  const [decoratorType, setDecoratorType] = useState(item.decoratorType || "supplier");

  // ── Pricing Tiers state ──
  const [tiers, setTiers] = useState(() => {
    if (lines.length > 0) {
      return lines.map((line: OrderItemLine) => ({
        id: line.id,
        quantity: line.quantity || 0,
        cost: Number(line.cost || 0),
        margin: Number(line.margin || 40),
        unitPrice: Number(line.unitPrice || 0),
        showToClient: true,
      }));
    }
    return [{
      id: "new-1",
      quantity: item.quantity || 0,
      cost: Number(item.cost || 0),
      margin: calcMargin(Number(item.cost || 0), Number(item.unitPrice || 0)),
      unitPrice: Number(item.unitPrice || 0),
      showToClient: true,
    }];
  });

  // ── Run Charges state (per-unit costs between Cost and Margin) ──
  const [runCharges, setRunCharges] = useState<Array<{
    id: string; description: string; costPerUnit: number; isNew?: boolean;
  }>>(() => {
    return (item.charges || [])
      .filter((c: any) => c.chargeType === "run")
      .map((c: any) => ({
        id: c.id,
        description: c.description || "",
        costPerUnit: Number(c.amount || 0),
      }));
  });

  // ── Fixed Charges state ──
  const [charges, setCharges] = useState<Array<{
    id: string; description: string; cost: number; margin: number; retail: number; isNew?: boolean;
  }>>(() => {
    return (item.charges || [])
      .filter((c: any) => c.chargeType !== "run")
      .map((c: any) => ({
        id: c.id,
        description: c.description || "",
        cost: Number(c.amount || 0),
        margin: 0,
        retail: Number(c.amount || 0),
      }));
  });

  // ── Colors state ──
  const [colors, setColors] = useState<string[]>(item.colors || []);
  const [newColorInput, setNewColorInput] = useState("");

  // ── Sizes state ──
  const [sizes, setSizes] = useState<string[]>(item.sizes || []);
  const [newSizeInput, setNewSizeInput] = useState("");

  // Total run charge cost per unit
  const totalRunChargeCost = runCharges.reduce((sum, rc) => sum + rc.costPerUnit, 0);

  const updateTier = (index: number, field: string, value: number) => {
    setTiers((prev: any[]) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      if (field === "cost" || field === "margin") {
        const baseCost = field === "cost" ? value : updated[index].cost;
        const effectiveCost = baseCost + totalRunChargeCost;
        const margin = field === "margin" ? value : updated[index].margin;
        updated[index].unitPrice = margin > 0 ? effectiveCost / (1 - margin / 100) : effectiveCost;
      } else if (field === "unitPrice") {
        const effectiveCost = updated[index].cost + totalRunChargeCost;
        updated[index].margin = calcMargin(effectiveCost, value);
      }
      return updated;
    });
  };

  const addTier = () => {
    setTiers((prev: any[]) => [...prev, {
      id: `new-${Date.now()}`,
      quantity: 0,
      cost: 0,
      margin: 40,
      unitPrice: 0,
      showToClient: true,
    }]);
  };

  const removeTier = (index: number) => {
    setTiers((prev: any[]) => prev.filter((_: any, i: number) => i !== index));
  };

  // ── Fixed Charge helpers ──
  const addCharge = () => {
    setCharges((prev) => [...prev, {
      id: `new-${Date.now()}`,
      description: "",
      cost: 0,
      margin: 0,
      retail: 0,
      isNew: true,
    }]);
  };

  const updateCharge = (index: number, field: string, value: string | number) => {
    setCharges((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      if (field === "cost" || field === "margin") {
        const cost = field === "cost" ? Number(value) : updated[index].cost;
        const margin = field === "margin" ? Number(value) : updated[index].margin;
        updated[index].retail = margin > 0 ? cost / (1 - margin / 100) : cost;
      } else if (field === "retail") {
        updated[index].margin = updated[index].cost > 0
          ? calcMargin(updated[index].cost, Number(value))
          : 0;
      }
      return updated;
    });
  };

  const removeCharge = (index: number) => {
    setCharges((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Run Charge helpers ──
  const addRunCharge = () => {
    setRunCharges((prev) => [...prev, {
      id: `new-${Date.now()}`,
      description: "",
      costPerUnit: 0,
      isNew: true,
    }]);
  };

  const updateRunCharge = (index: number, field: string, value: string | number) => {
    setRunCharges((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const removeRunCharge = (index: number) => {
    setRunCharges((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Color helpers ──
  const addColor = () => {
    const trimmed = newColorInput.trim();
    if (trimmed && !colors.includes(trimmed)) {
      setColors((prev) => [...prev, trimmed]);
      setNewColorInput("");
    }
  };

  const removeColor = (index: number) => {
    setColors((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Size helpers ──
  const addSize = () => {
    const trimmed = newSizeInput.trim();
    if (trimmed && !sizes.includes(trimmed)) {
      setSizes((prev) => [...prev, trimmed]);
      setNewSizeInput("");
    }
  };

  const removeSize = (index: number) => {
    setSizes((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Save all ──
  const saveMutation = useMutation({
    mutationFn: async () => {
      // 1. Save pricing tiers (delete old, create new)
      for (const line of lines) {
        await apiRequest("DELETE", `/api/order-items/${item.id}/lines/${line.id}`);
      }
      for (const tier of tiers) {
        if (tier.quantity > 0) {
          await apiRequest("POST", `/api/order-items/${item.id}/lines`, {
            orderItemId: item.id,
            quantity: tier.quantity,
            cost: tier.cost.toFixed(2),
            unitPrice: tier.unitPrice.toFixed(2),
            totalPrice: (tier.quantity * tier.unitPrice).toFixed(2),
            margin: tier.margin.toFixed(2),
          });
        }
      }

      // 2. Save all charges (fixed + run) — delete removed, update existing, create new
      const existingChargeIds = (item.charges || []).map((c: any) => c.id);
      const currentFixedIds = charges.filter((c) => !c.isNew).map((c) => c.id);
      const currentRunIds = runCharges.filter((c) => !c.isNew).map((c) => c.id);
      const allCurrentIds = [...currentFixedIds, ...currentRunIds];
      // Delete removed charges
      for (const id of existingChargeIds) {
        if (!allCurrentIds.includes(id)) {
          await apiRequest("DELETE", `/api/order-items/${item.id}/charges/${id}`);
        }
      }
      // Save fixed charges
      for (const charge of charges) {
        if (charge.isNew) {
          await apiRequest("POST", `/api/order-items/${item.id}/charges`, {
            orderItemId: item.id,
            description: charge.description,
            amount: charge.retail.toFixed(2),
            chargeType: "fixed",
            isVendorCharge: false,
          });
        } else {
          await apiRequest("PATCH", `/api/order-items/${item.id}/charges/${charge.id}`, {
            description: charge.description,
            amount: charge.retail.toFixed(2),
          });
        }
      }
      // Save run charges
      for (const rc of runCharges) {
        if (rc.isNew) {
          await apiRequest("POST", `/api/order-items/${item.id}/charges`, {
            orderItemId: item.id,
            description: rc.description,
            amount: rc.costPerUnit.toFixed(2),
            chargeType: "run",
            isVendorCharge: false,
          });
        } else {
          await apiRequest("PATCH", `/api/order-items/${item.id}/charges/${rc.id}`, {
            description: rc.description,
            amount: rc.costPerUnit.toFixed(2),
          });
        }
      }

      // 3. Save colors and sizes to product
      if (item.productId) {
        await apiRequest("PATCH", `/api/products/${item.productId}`, {
          colors: colors,
          sizes: sizes,
        });
      }

      // 4. Save order item fields (priceLabel, personalComment, privateNotes, decoration)
      await apiRequest("PATCH", `/api/orders/${orderId}/items/${item.id}`, {
        priceLabel: priceLabel || null,
        personalComment: personalComment || null,
        privateNotes: privateNotes || null,
        imprintLocation: imprintLocation || null,
        imprintMethod: imprintMethod || null,
        decoratorType: decoratorType || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}/all-item-lines`] });
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}/all-item-charges`] });
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}/items`] });
      toast({ title: "Product pricing updated" });
      onClose();
    },
    onError: () => {
      toast({ title: "Failed to save", variant: "destructive" });
    },
  });

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {item.imageUrl && (
              <img src={item.imageUrl} alt="" className="w-12 h-12 object-contain rounded-lg bg-gray-50" />
            )}
            <div>
              <p>{item.productName}</p>
              <p className="text-sm font-normal text-gray-500">{item.supplierName} {item.productSku ? `· ${item.productSku}` : ""}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Description */}
        {item.description && (
          <p className="text-sm text-gray-500 mt-1 max-h-20 overflow-y-auto">{item.description}</p>
        )}

        {/* Product Image thumbnails */}
        {item.imageUrl && (
          <div className="flex gap-2 mt-2">
            <img src={item.imageUrl} alt="" className="w-14 h-14 object-contain rounded-lg bg-gray-50 border" />
          </div>
        )}

        {/* Price Label */}
        <div className="mt-3">
          <label className="text-xs font-medium text-gray-500 block mb-1">Price Label</label>
          <Input value={priceLabel} onChange={(e) => setPriceLabel(e.target.value)} placeholder="e.g. Budget Option, Premium Tier..." className="h-8 text-sm" />
        </div>

        {/* ── Pricing Table — CommonSKU Horizontal Layout ── */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold">Pricing</h4>
            <Button size="sm" variant="outline" onClick={addTier} className="h-7 text-xs">
              <Plus className="w-3 h-3 mr-1" />Add Tier
            </Button>
          </div>

          <div className="border rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 w-[120px]" />
                  {tiers.map((_: any, idx: number) => (
                    <th key={idx} className="text-center px-2 py-2 text-xs font-semibold text-gray-500 min-w-[100px]">
                      <div className="flex items-center justify-between">
                        <span>Tier {idx + 1}</span>
                        {tiers.length > 1 && (
                          <button onClick={() => removeTier(idx)} className="text-red-400 hover:text-red-600 ml-1">
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Qty row */}
                <tr className="border-b">
                  <td className="px-3 py-1.5 text-xs font-semibold text-gray-600">Qty</td>
                  {tiers.map((tier: any, idx: number) => (
                    <td key={idx} className="px-2 py-1.5">
                      <Input
                        type="number"
                        value={tier.quantity || ""}
                        onChange={(e) => updateTier(idx, "quantity", parseInt(e.target.value) || 0)}
                        className="h-7 text-sm text-center"
                      />
                    </td>
                  ))}
                </tr>

                {/* Show to client row */}
                <tr className="border-b bg-gray-50/50">
                  <td className="px-3 py-1.5 text-xs font-semibold text-gray-600">Show to client?</td>
                  {tiers.map((tier: any, idx: number) => (
                    <td key={idx} className="px-2 py-1.5 text-center">
                      <input
                        type="checkbox"
                        checked={tier.showToClient}
                        onChange={(e) => {
                          setTiers((prev: any[]) => {
                            const updated = [...prev];
                            updated[idx] = { ...updated[idx], showToClient: e.target.checked };
                            return updated;
                          });
                        }}
                        className="rounded border-gray-300"
                      />
                    </td>
                  ))}
                </tr>

                {/* Cost row */}
                <tr className="border-b">
                  <td className="px-3 py-1.5 text-xs font-semibold text-gray-600">Cost</td>
                  {tiers.map((tier: any, idx: number) => (
                    <td key={idx} className="px-2 py-1.5">
                      <Input
                        type="number"
                        step="0.01"
                        value={tier.cost || ""}
                        onChange={(e) => updateTier(idx, "cost", parseFloat(e.target.value) || 0)}
                        className="h-7 text-sm text-center"
                      />
                    </td>
                  ))}
                </tr>

                {/* Run charge rows */}
                {runCharges.map((rc, rcIdx) => (
                  <tr key={rc.id} className="border-b bg-orange-50/40">
                    <td className="px-3 py-1 text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        <Input
                          value={rc.description}
                          onChange={(e) => updateRunCharge(rcIdx, "description", e.target.value)}
                          placeholder="Charge name"
                          className="h-6 text-xs w-[100px]"
                        />
                        <button onClick={() => removeRunCharge(rcIdx)} className="text-red-400 hover:text-red-600 flex-shrink-0">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                    {tiers.map((_: any, idx: number) => (
                      <td key={idx} className="px-2 py-1">
                        <Input
                          type="number"
                          step="0.01"
                          value={rc.costPerUnit || ""}
                          onChange={(e) => updateRunCharge(rcIdx, "costPerUnit", parseFloat(e.target.value) || 0)}
                          className="h-6 text-xs text-center"
                        />
                      </td>
                    ))}
                  </tr>
                ))}

                {/* + add run charge link */}
                <tr className="border-b bg-gray-50/30">
                  <td colSpan={tiers.length + 1} className="px-3 py-1">
                    <button onClick={addRunCharge} className="text-xs text-teal-600 hover:text-teal-800 hover:underline">+ add run charge</button>
                  </td>
                </tr>

                {/* Margin row */}
                <tr className="border-b">
                  <td className="px-3 py-1.5 text-xs font-semibold text-gray-600">Margin</td>
                  {tiers.map((tier: any, idx: number) => (
                    <td key={idx} className="px-2 py-1.5">
                      <div className="relative">
                        <Input
                          type="number"
                          step="0.01"
                          value={tier.margin.toFixed(2)}
                          onChange={(e) => updateTier(idx, "margin", parseFloat(e.target.value) || 0)}
                          className={`h-7 text-sm text-center pr-6 ${marginColor(tier.margin)}`}
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Total row (was Client Price) */}
                <tr className="bg-gray-50">
                  <td className="px-3 py-1.5 text-xs font-bold text-gray-700">Total</td>
                  {tiers.map((tier: any, idx: number) => (
                    <td key={idx} className="px-2 py-1.5">
                      <Input
                        type="number"
                        step="0.01"
                        value={tier.unitPrice.toFixed(2)}
                        onChange={(e) => updateTier(idx, "unitPrice", parseFloat(e.target.value) || 0)}
                        className="h-7 text-sm text-center font-semibold"
                      />
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Fixed Charges ── */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold">Fixed Charges</h4>
            <Button size="sm" variant="outline" onClick={addCharge} className="h-7 text-xs">
              <Plus className="w-3 h-3 mr-1" />Add Fixed Charge
            </Button>
          </div>

          {charges.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <div className="grid grid-cols-[1fr_90px_80px_90px_36px] gap-2 px-3 py-2 bg-gray-50 border-b text-xs font-semibold text-gray-500">
                <span>Label</span>
                <span className="text-right">Cost</span>
                <span className="text-right">Margin %</span>
                <span className="text-right">Retail</span>
                <span />
              </div>
              {charges.map((charge, idx) => (
                <div key={charge.id} className="grid grid-cols-[1fr_90px_80px_90px_36px] gap-2 px-3 py-1.5 border-b last:border-b-0 items-center">
                  <Input
                    value={charge.description}
                    onChange={(e) => updateCharge(idx, "description", e.target.value)}
                    placeholder="Charge name"
                    className="h-7 text-sm"
                  />
                  <Input
                    type="number"
                    step="0.01"
                    value={charge.cost || ""}
                    onChange={(e) => updateCharge(idx, "cost", parseFloat(e.target.value) || 0)}
                    className="h-7 text-sm text-right"
                  />
                  <Input
                    type="number"
                    step="0.01"
                    value={charge.margin.toFixed(1)}
                    onChange={(e) => updateCharge(idx, "margin", parseFloat(e.target.value) || 0)}
                    className="h-7 text-sm text-right"
                  />
                  <Input
                    type="number"
                    step="0.01"
                    value={charge.retail.toFixed(2)}
                    onChange={(e) => updateCharge(idx, "retail", parseFloat(e.target.value) || 0)}
                    className="h-7 text-sm text-right font-medium"
                  />
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-400 hover:text-red-600" onClick={() => removeCharge(idx)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="border rounded-lg p-4 text-center">
              <p className="text-sm text-gray-400 mb-2">No fixed charges</p>
              <button onClick={addCharge} className="text-xs text-teal-600 hover:text-teal-800 hover:underline">+ add fixed charge</button>
            </div>
          )}
        </div>

        {/* ── Product Colors ── */}
        <div className="mt-5">
          <h4 className="text-sm font-semibold mb-2">Product Colors</h4>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {colors.length > 0 ? colors.map((color: string, idx: number) => (
              <Badge key={idx} variant="secondary" className="text-xs gap-1 pr-1">
                <span className="w-3 h-3 rounded-full border border-gray-300 inline-block flex-shrink-0" style={{ backgroundColor: color.toLowerCase() }} />
                {color}
                <button onClick={() => removeColor(idx)} className="ml-0.5 text-gray-400 hover:text-red-500">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )) : (
              <p className="text-sm text-gray-400">No colors assigned</p>
            )}
          </div>
          <div className="flex gap-2">
            <Input
              value={newColorInput}
              onChange={(e) => setNewColorInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addColor(); } }}
              placeholder="Add a new color (e.g. Navy Blue)"
              className="h-8 text-sm flex-1"
            />
            <Button size="sm" variant="outline" onClick={addColor} className="h-8 text-xs" disabled={!newColorInput.trim()}>
              <Plus className="w-3 h-3 mr-1" />Add
            </Button>
          </div>
        </div>

        {/* ── Product Sizes ── */}
        <div className="mt-5">
          <h4 className="text-sm font-semibold mb-2">Product Sizes</h4>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {sizes.length > 0 ? sizes.map((size: string, idx: number) => (
              <Badge key={idx} variant="secondary" className="text-xs gap-1 pr-1">
                {size}
                <button onClick={() => removeSize(idx)} className="ml-0.5 text-gray-400 hover:text-red-500">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )) : (
              <p className="text-sm text-gray-400">No sizes assigned</p>
            )}
          </div>
          <div className="flex gap-2">
            <Input
              value={newSizeInput}
              onChange={(e) => setNewSizeInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSize(); } }}
              placeholder="Add a size (e.g. S, M, L, XL)"
              className="h-8 text-sm flex-1"
            />
            <Button size="sm" variant="outline" onClick={addSize} className="h-8 text-xs" disabled={!newSizeInput.trim()}>
              <Plus className="w-3 h-3 mr-1" />Add
            </Button>
          </div>
        </div>

        {/* ── Decoration Info ── */}
        <div className="mt-5">
          <h4 className="text-sm font-semibold mb-3">Decoration</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Imprint Location</label>
              <Select value={imprintLocation} onValueChange={setImprintLocation}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left_chest">Left Chest</SelectItem>
                  <SelectItem value="right_chest">Right Chest</SelectItem>
                  <SelectItem value="full_front">Full Front</SelectItem>
                  <SelectItem value="full_back">Full Back</SelectItem>
                  <SelectItem value="left_sleeve">Left Sleeve</SelectItem>
                  <SelectItem value="right_sleeve">Right Sleeve</SelectItem>
                  <SelectItem value="collar">Collar / Nape</SelectItem>
                  <SelectItem value="cap_front">Cap Front</SelectItem>
                  <SelectItem value="cap_back">Cap Back</SelectItem>
                  <SelectItem value="front_panel">Front Panel</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Imprint Method</label>
              <Select value={imprintMethod} onValueChange={setImprintMethod}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="screen_print">Screen Printing</SelectItem>
                  <SelectItem value="embroidery">Embroidery</SelectItem>
                  <SelectItem value="heat_transfer">Heat Transfer</SelectItem>
                  <SelectItem value="dtf">Direct-to-Film (DTF)</SelectItem>
                  <SelectItem value="sublimation">Sublimation</SelectItem>
                  <SelectItem value="laser_engraving">Laser Engraving</SelectItem>
                  <SelectItem value="pad_print">Pad Printing</SelectItem>
                  <SelectItem value="deboss">Deboss / Emboss</SelectItem>
                  <SelectItem value="none">No Decoration</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Decorator</label>
              <Select value={decoratorType} onValueChange={setDecoratorType}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="supplier">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-green-600" />
                      Supplier Decorator
                    </span>
                  </SelectItem>
                  <SelectItem value="third_party">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-orange-600" />
                      3rd Party Decorator
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[10px] text-gray-400 mt-1">
                {decoratorType === "supplier"
                  ? "Supplier provides both blank goods and decoration"
                  : "Blank goods ship to separate decorator for imprinting"}
              </p>
            </div>
          </div>
        </div>

        {/* ── Personal Comment ── */}
        <div className="mt-4">
          <label className="text-xs font-medium text-gray-500 block mb-1">Personal Comment</label>
          <Textarea
            value={personalComment}
            onChange={(e) => setPersonalComment(e.target.value)}
            placeholder="Add a personal comment for the client..."
            className="min-h-[60px] resize-none text-sm"
          />
        </div>

        {/* ── Private Notes ── */}
        <div className="mt-3">
          <label className="text-xs font-medium text-gray-500 block mb-1">Private Notes (internal only)</label>
          <Textarea
            value={privateNotes}
            onChange={(e) => setPrivateNotes(e.target.value)}
            placeholder="Internal notes — not visible to the client..."
            className="min-h-[60px] resize-none text-sm bg-yellow-50"
          />
        </div>

        {/* ── Actions ── */}
        <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? "Saving..." : "Save All Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Product Preview Lightbox ─────────────────────────────────────
function ProductPreviewLightbox({ item, companyName, hidePricing, onClose }: {
  item: any; companyName: string; hidePricing: boolean; onClose: () => void;
}) {
  const lines: OrderItemLine[] = item.lines || [];
  const price = Number(item.unitPrice || 0);

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        {/* Header banner */}
        <div className="bg-gray-800 text-white px-6 py-4 flex items-center gap-3 rounded-t-lg">
          <div>
            <h3 className="font-bold text-lg">{companyName}</h3>
            <p className="text-gray-300 text-sm">Product Detail</p>
          </div>
          <Button variant="ghost" size="sm" className="ml-auto text-white hover:bg-gray-700" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
          {/* Left - Image */}
          <div>
            <div className="aspect-square bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.productName || ""} className="w-full h-full object-contain p-6" />
              ) : (
                <Package className="w-24 h-24 text-gray-200" />
              )}
            </div>
          </div>

          {/* Right - Details */}
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold">{item.productName}</h2>
              {item.productSku && <p className="text-sm text-gray-400">SKU: {item.productSku}</p>}
              {item.brand && <p className="text-sm text-gray-500">{item.brand}</p>}
            </div>

            {item.description && (
              <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>
            )}

            {/* Pricing Table */}
            {!hidePricing && (
              <div>
                <h4 className="font-semibold text-sm mb-2">Pricing</h4>
                <div className="border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-2 gap-0">
                    <div className="px-3 py-1.5 bg-gray-50 border-b border-r text-xs font-semibold text-gray-500">Qty</div>
                    <div className="px-3 py-1.5 bg-gray-50 border-b text-xs font-semibold text-gray-500">Price</div>
                    {lines.length > 0 ? (
                      lines.map((line: OrderItemLine) => (
                        <div key={line.id} className="contents">
                          <div className="px-3 py-1.5 border-b border-r text-sm">{line.quantity}</div>
                          <div className="px-3 py-1.5 border-b text-sm font-medium">${Number(line.unitPrice || 0).toFixed(2)}</div>
                        </div>
                      ))
                    ) : (
                      <div className="contents">
                        <div className="px-3 py-1.5 border-b border-r text-sm">{item.quantity}</div>
                        <div className="px-3 py-1.5 border-b text-sm font-medium">${price.toFixed(2)}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Colors */}
            {item.colors && item.colors.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-2">Colors</h4>
                <p className="text-sm text-gray-600">
                  {item.colors.join(" · ")}
                </p>
              </div>
            )}

            {/* Sizes */}
            {item.sizes && item.sizes.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-2">Sizes</h4>
                <p className="text-sm text-gray-600 uppercase">
                  {item.sizes.join(" · ")}
                </p>
              </div>
            )}

            {/* Comment section placeholder */}
            <div className="pt-4">
              <Button variant="outline" className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700">
                Comment
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Artwork Grid ─────────────────────────────────────────────────
function ArtworkGrid({ data }: { data: ReturnType<typeof useProjectData> }) {
  const { allArtworkItems, orderItems } = data;

  const artworks = useMemo(() => {
    const allArt: any[] = [];
    if (allArtworkItems && typeof allArtworkItems === "object") {
      Object.entries(allArtworkItems).forEach(([itemId, arts]: [string, any[]]) => {
        const item = orderItems.find((i: any) => i.id === itemId);
        arts.forEach((art: any) => {
          allArt.push({ ...art, productName: item?.productName || "Unknown Product" });
        });
      });
    }
    return allArt;
  }, [allArtworkItems, orderItems]);

  if (artworks.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Palette className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No artwork files yet</h3>
          <p className="text-gray-500">Artwork files will appear here when uploaded to order items</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {artworks.map((art: any) => (
        <Card key={art.id} className="overflow-hidden hover:shadow-md transition-shadow">
          <div className="aspect-video bg-gray-50 flex items-center justify-center overflow-hidden">
            {art.fileUrl || art.filePath ? (
              <img src={art.fileUrl || art.filePath} alt={art.fileName || "Artwork"} className="w-full h-full object-contain p-2" />
            ) : (
              <Palette className="w-12 h-12 text-gray-200" />
            )}
          </div>
          <CardContent className="p-3">
            <p className="text-sm font-medium truncate">{art.fileName || "Artwork"}</p>
            <p className="text-xs text-gray-400">{art.productName}</p>
            {art.status && <Badge variant="outline" className="mt-1 text-xs">{art.status}</Badge>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
