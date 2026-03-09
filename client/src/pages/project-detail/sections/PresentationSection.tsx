import { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  DialogFooter,
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
  Loader2,
  MessageSquare,
} from "lucide-react";
import { format } from "date-fns";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { OrderItemLine } from "@shared/schema";
import type { useProjectData } from "../hooks/useProjectData";
import { IMPRINT_LOCATIONS, IMPRINT_METHODS } from "@/lib/imprintOptions";
import FilePickerDialog from "@/components/modals/FilePickerDialog";
import StageConversionDialog from "../components/StageConversionDialog";
import SendPresentationDialog from "@/components/modals/SendPresentationDialog";
import { Separator } from "@/components/ui/separator";

interface PresentationSectionProps {
  orderId: string;
  data: ReturnType<typeof useProjectData>;
}

type ViewMode = "detailed" | "grid";

const presentationStatuses = [
  { value: "open", label: "Open", color: "bg-blue-100 text-blue-800" },
  { value: "client_review", label: "Client Review", color: "bg-purple-100 text-purple-800" },
  { value: "converted", label: "Converted", color: "bg-green-100 text-green-800" },
  { value: "closed", label: "Closed", color: "bg-gray-100 text-gray-800" },
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

  const currentStatus = (order as any)?.presentationStatus || "open";
  const statusInfo = presentationStatuses.find((s) => s.value === currentStatus) || presentationStatuses[0];

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      await apiRequest("PATCH", `/api/orders/${orderId}`, { presentationStatus: newStatus });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}`] }),
    onError: () => toast({ title: "Failed to update status", variant: "destructive" }),
  });

  // Presentation settings from stageData (persisted)
  const presSettings = (order as any)?.stageData?.presentation || {};

  const [isInfoCollapsed, setIsInfoCollapsed] = useState(false);
  const [introduction, setIntroduction] = useState(presSettings.introduction || "");
  const [hidePricing, setHidePricing] = useState(presSettings.hidePricing || false);
  const [conversionTarget, setConversionTarget] = useState<"quote" | "sales_order" | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("detailed");
  const [selectedContact, setSelectedContact] = useState(presSettings.clientContactId || primaryContact?.id || "");
  const [editingItem, setEditingItem] = useState<any>(null);
  const [previewItem, setPreviewItem] = useState<any>(null);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [expiryDate, setExpiryDate] = useState(presSettings.expiryDate || "");
  const [currency, setCurrency] = useState(presSettings.currency || "USD");
  const [presentationDate, setPresentationDate] = useState(presSettings.presentationDate || (order?.createdAt ? format(new Date(order.createdAt), "yyyy-MM-dd") : ""));

  // Design tab state (persisted)
  const [primaryColor, setPrimaryColor] = useState(presSettings.primaryColor || "#1c6ea4");
  const [headerStyle, setHeaderStyle] = useState(presSettings.headerStyle || "banner");
  const [fontFamily, setFontFamily] = useState(presSettings.fontFamily || "default");
  const [footerText, setFooterText] = useState(presSettings.footerText || "");

  // Save presentation settings to stageData
  const saveSettingsMutation = useMutation({
    mutationFn: async (updates: Record<string, any>) => {
      const currentStageData = (order as any)?.stageData || {};
      const currentPresentation = currentStageData.presentation || {};
      await apiRequest("PATCH", `/api/orders/${orderId}`, {
        stageData: {
          ...currentStageData,
          presentation: { ...currentPresentation, ...updates },
        },
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}`] }),
    onError: () => toast({ title: "Failed to save settings", variant: "destructive" }),
  });

  // Helper to save a single field
  const saveSetting = (key: string, value: any) => saveSettingsMutation.mutate({ [key]: value });

  // Share link
  const [shareLink, setShareLink] = useState<string | null>(null);
  const shareLinkMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/orders/${orderId}/presentation/share-link`);
      return await res.json();
    },
    onSuccess: (data: any) => {
      const url = data.url;
      setShareLink(url);
      navigator.clipboard.writeText(url).then(() => {
        toast({ title: "Link copied!", description: data.existingToken ? "Existing link copied to clipboard." : "New presentation link created and copied." });
      });
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}`] });
    },
    onError: () => toast({ title: "Failed to generate link", variant: "destructive" }),
  });

  // Product visibility & ordering
  const [showHidden, setShowHidden] = useState(false);
  const itemVisibility: Record<string, boolean> = presSettings.itemVisibility || {};
  const itemOrder: string[] = presSettings.itemOrder || [];

  const toggleItemVisibility = (itemId: string) => {
    const updated = { ...itemVisibility, [itemId]: !(itemVisibility[itemId] !== false) };
    saveSetting("itemVisibility", updated);
  };

  const moveItem = (itemId: string, direction: "up" | "down") => {
    const currentOrder = itemOrder.length > 0 ? [...itemOrder] : orderItems.map((i: any) => i.id);
    const idx = currentOrder.indexOf(itemId);
    if (idx === -1) return;
    const newIdx = direction === "up" ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= currentOrder.length) return;
    [currentOrder[idx], currentOrder[newIdx]] = [currentOrder[newIdx], currentOrder[idx]];
    saveSetting("itemOrder", currentOrder);
  };

  // Enrich order items with product data, apply ordering & visibility
  const enrichedItems = useMemo(() => {
    const items = orderItems.map((item: any) => {
      const product = allProducts.find((p: any) => p.id === item.productId);
      const lines = allItemLines?.[item.id] || [];
      const charges = allItemCharges?.[item.id] || [];
      const isVisible = itemVisibility[item.id] !== false;
      return {
        ...item,
        imageUrl: item.productImageUrl || product?.imageUrl || null,
        colors: item.productColors || product?.colors || [],
        sizes: item.productSizes || product?.sizes || [],
        brand: item.productBrand || product?.brand || null,
        description: item.productDescription || product?.description || null,
        lines,
        charges,
        isVisible,
      };
    });

    // Apply custom ordering
    if (itemOrder.length > 0) {
      items.sort((a: any, b: any) => {
        const aIdx = itemOrder.indexOf(a.id);
        const bIdx = itemOrder.indexOf(b.id);
        return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx);
      });
    }

    return items;
  }, [orderItems, allProducts, allItemLines, allItemCharges, itemVisibility, itemOrder]);

  const visibleItems = useMemo(() => enrichedItems.filter((i: any) => i.isVisible), [enrichedItems]);
  const displayItems = showHidden ? enrichedItems : visibleItems;
  const hiddenCount = enrichedItems.length - visibleItems.length;

  // Product comments
  const { data: productComments = {} } = useQuery<Record<string, any[]>>({
    queryKey: [`/api/orders/${orderId}/product-comments`],
    enabled: !!orderId,
  });

  if (!order) return null;

  const contactEmail = contacts?.find((c: any) => c.id === selectedContact)?.email || primaryContact?.email || "";

  return (
    <div className="space-y-6">
      {/* Top Info Bar */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Status</label>
            <Select value={currentStatus} onValueChange={(val) => updateStatusMutation.mutate(val)}>
              <SelectTrigger className="min-w-[140px] h-9">
                <SelectValue>
                  <span className="flex items-center text-nowrap gap-2">
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
            <Input
              type="date"
              value={presentationDate}
              onChange={(e) => setPresentationDate(e.target.value)}
              onBlur={() => saveSetting("presentationDate", presentationDate)}
              className="w-[160px] h-9"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">In Hands Date</label>
            <Input
              type="date"
              defaultValue={order.inHandsDate ? format(new Date(order.inHandsDate), "yyyy-MM-dd") : ""}
              onBlur={(e) => {
                if (e.target.value !== (order.inHandsDate ? format(new Date(order.inHandsDate), "yyyy-MM-dd") : "")) {
                  apiRequest("PATCH", `/api/orders/${orderId}`, { inHandsDate: e.target.value || null })
                    .then(() => queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}`] }));
                }
              }}
              className="w-[160px] h-9"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1" onClick={() => setLocation(`/project/${orderId}/presentation/preview`)}>
            <Eye className="w-4 h-4" />
            Preview
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={() => shareLinkMutation.mutate()}
            disabled={shareLinkMutation.isPending}
          >
            <CopyIcon className="w-4 h-4" />
            {shareLinkMutation.isPending ? "Generating..." : "Copy Link"}
          </Button>
          <Button size="sm" className="gap-1" onClick={() => setShowSendDialog(true)}>
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
            <p className="text-xs text-gray-500 mt-0.5">Convert this presentation to a quote or skip directly to a sales order.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 border-amber-300 text-amber-700 hover:bg-amber-50 hover:text-amber-700"
              onClick={() => setConversionTarget("quote")}
            >
              <ArrowRight className="w-4 h-4" />
              Convert to Quote
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
              <Textarea
                value={introduction}
                onChange={(e) => setIntroduction(e.target.value)}
                onBlur={() => saveSetting("introduction", introduction)}
                placeholder="Add a message or introduction for this presentation..."
                className="min-h-[80px] resize-none"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Client Contact</label>
                <Select value={selectedContact} onValueChange={(val) => { setSelectedContact(val); saveSetting("clientContactId", val); }}>
                  <SelectTrigger className="h-9 text-start "><SelectValue className="text-start" placeholder="Select contact" /></SelectTrigger>
                  <SelectContent>
                    {contacts?.map((contact: any) => (
                      <SelectItem key={contact.id} value={contact.id}>{contact.firstName} | {contact.email}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Expiry Date</label>
                <Input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  onBlur={() => saveSetting("expiryDate", expiryDate || null)}
                  className="h-9"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Currency</label>
                <Select value={currency} onValueChange={(val) => { setCurrency(val); saveSetting("currency", val); }}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="CAD">CAD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 pb-1">
                <input type="checkbox" id="hidePricing" checked={hidePricing} onChange={(e) => { setHidePricing(e.target.checked); saveSetting("hidePricing", e.target.checked); }} className="rounded border-gray-300" />
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
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-3">
            <Button onClick={() => { setLocation(`/project/${orderId}/presentation/add`); }} size="sm" className="gap-1 text-white" style={{ backgroundColor: primaryColor }}>
              <Plus className="w-4 h-4" />Product From Database
            </Button>
          </div>
          {hiddenCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-xs"
              onClick={() => setShowHidden(!showHidden)}
            >
              {showHidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              {showHidden ? "Show Active Only" : `Show All (${hiddenCount} hidden)`}
            </Button>
          )}
        </div>

        {/* Products Tab */}
        <TabsContent value="products" className="mt-4">
          {enrichedItems.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Package className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No products yet</h3>
                <p className="text-gray-500 mb-4">Add products from the database or get AI recommendations</p>
                <Button variant="outline" onClick={() => setLocation(`/project/${orderId}/presentation/add`)}>
                  <Plus className="w-4 h-4 mr-2" />Add Product
                </Button>
              </CardContent>
            </Card>
          ) : viewMode === "grid" ? (
            <GridView items={displayItems} hidePricing={hidePricing} onPreview={setPreviewItem} onToggleVisibility={toggleItemVisibility} />
          ) : (
            <DetailedView items={displayItems} hidePricing={hidePricing} onEdit={setEditingItem} onPreview={setPreviewItem} onToggleVisibility={toggleItemVisibility} onMoveItem={moveItem} />
          )}
        </TabsContent>

        {/* Artwork Tab */}
        <TabsContent value="artwork" className="mt-4">
          <ArtworkGrid data={data} orderId={orderId} enrichedItems={enrichedItems} />
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
                        onBlur={() => saveSetting("primaryColor", primaryColor)}
                        className="w-10 h-10 rounded cursor-pointer border border-gray-200"
                      />
                      <Input
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        onBlur={() => saveSetting("primaryColor", primaryColor)}
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
                    <Select value={headerStyle} onValueChange={(val) => { setHeaderStyle(val); saveSetting("headerStyle", val); }}>
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
                    <Select value={fontFamily} onValueChange={(val) => { setFontFamily(val); saveSetting("fontFamily", val); }}>
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
                      value={footerText}
                      onChange={(e) => setFooterText(e.target.value)}
                      onBlur={() => saveSetting("footerText", footerText)}
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
          orderId={orderId}
          companyName={companyName}
          hidePricing={hidePricing}
          comments={productComments[previewItem.id] || []}
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

      {showSendDialog && (
        <SendPresentationDialog
          open={showSendDialog}
          onOpenChange={setShowSendDialog}
          orderId={orderId}
          recipientEmail={contactEmail}
          recipientName={contacts?.find((c: any) => c.id === selectedContact)
            ? `${contacts.find((c: any) => c.id === selectedContact)?.firstName} ${contacts.find((c: any) => c.id === selectedContact)?.lastName}`
            : companyName}
          companyName={companyName}
          orderNumber={order.orderNumber || ""}
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
                    <div key={line.id} className="grid grid-cols-[36px_1fr_100px_100px_100px] gap-2 py-1">
                      <span /><span />
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
            {item.imageUrl ? (
              <img src={item.imageUrl} alt="" className="w-12 h-12 object-contain rounded-lg bg-gray-50" />
            ) : (
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Package className="w-5 h-5 text-gray-400" />
              </div>
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
        <div className="flex gap-2 mt-2">
          {item.imageUrl ? (
            <img src={item.imageUrl} alt="" className="w-14 h-14 object-contain rounded-lg bg-gray-50 border" />
          ) : (
            <div className="w-14 h-14 bg-gray-100 rounded-lg border flex items-center justify-center">
              <Package className="w-5 h-5 text-gray-400" />
            </div>
          )}
        </div>

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
                  {IMPRINT_LOCATIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
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
                  {IMPRINT_METHODS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
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
function ProductPreviewLightbox({ item, orderId, companyName, hidePricing, comments, onClose }: {
  item: any; orderId: string; companyName: string; hidePricing: boolean; comments: any[]; onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const lines: OrderItemLine[] = item.lines || [];
  const price = Number(item.unitPrice || 0);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");

  const postCommentMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/orders/${orderId}/product-comments`, {
        orderItemId: item.id,
        content: commentText,
      });
    },
    onSuccess: () => {
      setCommentText("");
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}/product-comments`] });
      toast({ title: "Comment posted" });
    },
    onError: () => toast({ title: "Failed to post comment", variant: "destructive" }),
  });

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 [&>button.absolute]:hidden">
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
                <p className="text-sm text-gray-600">{item.colors.join(" · ")}</p>
              </div>
            )}

            {/* Sizes */}
            {item.sizes && item.sizes.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-2">Sizes</h4>
                <p className="text-sm text-gray-600 uppercase">{item.sizes.join(" · ")}</p>
              </div>
            )}

            {/* Comments Section */}
            <div className="pt-2 border-t">
              <button
                onClick={() => setShowComments(!showComments)}
                className="flex items-center gap-2 w-full py-2 text-sm font-medium text-teal-700 hover:text-teal-800"
              >
                <MessageSquare className="w-4 h-4" />
                {comments.length > 0 ? `Comments (${comments.length})` : "Add a Comment"}
              </button>

              {showComments && (
                <div className="space-y-3 mt-2">
                  {comments.map((c: any) => (
                    <div key={c.id} className={`p-3 rounded-lg text-sm ${c.isClient ? "bg-blue-50" : "bg-yellow-50"}`}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium text-xs">{c.isClient ? c.clientName || "Client" : "You"}</span>
                        <span className="text-xs text-gray-400">
                          {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ""}
                        </span>
                      </div>
                      <p className="text-gray-700">{c.content}</p>
                    </div>
                  ))}

                  <div className="flex gap-2">
                    <Textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Add your comment..."
                      className="min-h-[60px] resize-none text-sm flex-1"
                    />
                  </div>
                  <Button
                    size="sm"
                    className="w-full gap-1 bg-teal-600 hover:bg-teal-700"
                    onClick={() => postCommentMutation.mutate()}
                    disabled={!commentText.trim() || postCommentMutation.isPending}
                  >
                    <Send className="w-3.5 h-3.5" />
                    {postCommentMutation.isPending ? "Posting..." : "Post Comment"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Artwork Grid ─────────────────────────────────────────────────
function ArtworkGrid({ data, orderId, enrichedItems }: { data: ReturnType<typeof useProjectData>; orderId: string; enrichedItems: any[] }) {
  const { allArtworkItems } = data;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Step 1: file picker for selecting item
  const [pickingForItem, setPickingForItem] = useState<string | null>(null);
  // Step 2: metadata form after file is picked
  const [pickedFile, setPickedFile] = useState<{ orderItemId: string; filePath: string; fileName: string } | null>(null);
  const [artName, setArtName] = useState("");
  const [artLocation, setArtLocation] = useState("");
  const [artMethod, setArtMethod] = useState("");

  const resetForm = () => {
    setPickedFile(null);
    setArtName("");
    setArtLocation("");
    setArtMethod("");
  };

  const createArtworkMutation = useMutation({
    mutationFn: async (payload: { orderItemId: string; name: string; filePath: string; fileName: string; location?: string; artworkType?: string }) => {
      const res = await apiRequest("POST", `/api/order-items/${payload.orderItemId}/artworks`, payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}/all-artworks`] });
      resetForm();
      toast({ title: "Artwork added" });
    },
    onError: () => toast({ title: "Failed to add artwork", variant: "destructive" }),
  });

  const deleteArtworkMutation = useMutation({
    mutationFn: async ({ artworkId, orderItemId }: { artworkId: string; orderItemId: string }) => {
      const res = await fetch(`/api/order-items/${orderItemId}/artworks/${artworkId}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Failed to delete artwork");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}/all-artworks`] });
      toast({ title: "Artwork removed" });
    },
    onError: () => toast({ title: "Failed to remove artwork", variant: "destructive" }),
  });

  if (enrichedItems.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Package className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No products yet</h3>
          <p className="text-gray-500">Add products first, then you can attach artwork to each one.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {enrichedItems.map((item: any) => {
          const artworks = allArtworkItems[item.id] || [];
          return (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.productName || ""} className="w-full h-full object-contain p-1" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-5 h-5 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.productName || "Unnamed Product"}</p>
                    {item.productSku && <p className="text-xs text-gray-400">{item.productSku}</p>}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setPickingForItem(item.id)}
                  >
                    <Upload className="w-3 h-3 mr-1" />
                    Add Artwork
                  </Button>
                </div>

                {artworks.length > 0 ? (
                  <div className="flex flex-wrap gap-3">
                    {artworks.map((art: any) => (
                      <div key={art.id} className="border rounded-lg p-2 bg-white w-36 group relative">
                        {art.filePath ? (
                          <img src={art.filePath} alt={art.name} className="w-full h-20 object-contain rounded mb-1.5" />
                        ) : (
                          <div className="w-full h-20 bg-gray-100 rounded flex items-center justify-center mb-1.5">
                            <Palette className="w-6 h-6 text-gray-300" />
                          </div>
                        )}
                        <p className="text-[10px] font-medium truncate">{art.name}</p>
                        <div className="flex items-center justify-between mt-0.5">
                          <div className="flex items-center gap-1">
                            <Badge
                              variant="outline"
                              className={`text-[9px] ${
                                art.status === "approved" ? "border-green-300 text-green-700" :
                                art.status === "rejected" ? "border-red-300 text-red-700" :
                                "border-yellow-300 text-yellow-700"
                              }`}
                            >
                              {art.status}
                            </Badge>
                            {art.location && <span className="text-[9px] text-gray-400">{art.location}</span>}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => deleteArtworkMutation.mutate({ artworkId: art.id, orderItemId: item.id })}
                          >
                            <Trash2 className="w-3 h-3 text-red-400" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">No artwork yet — click "Add Artwork" to upload</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Step 1: File Picker */}
      <FilePickerDialog
        open={!!pickingForItem}
        onClose={() => setPickingForItem(null)}
        onSelect={(files) => {
          const file = files[0];
          if (file && pickingForItem) {
            setPickedFile({
              orderItemId: pickingForItem,
              filePath: file.cloudinaryUrl,
              fileName: file.originalName || file.fileName,
            });
            setArtName(file.originalName || file.fileName);
          }
          setPickingForItem(null);
        }}
        multiple={false}
        contextOrderId={orderId}
        title="Select Artwork File"
      />

      {/* Step 2: Artwork Metadata Dialog */}
      <Dialog open={!!pickedFile} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Artwork Details
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {pickedFile && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <img
                  src={pickedFile.filePath}
                  alt={pickedFile.fileName}
                  className="w-16 h-16 object-contain rounded border bg-white"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
                <p className="text-sm text-gray-600 truncate flex-1">{pickedFile.fileName}</p>
              </div>
            )}
            <div>
              <Label>Name</Label>
              <Input value={artName} onChange={(e) => setArtName(e.target.value)} placeholder="e.g., Logo Front" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Decoration Location</Label>
                <Select value={artLocation} onValueChange={setArtLocation}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {IMPRINT_LOCATIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Imprint Method</Label>
                <Select value={artMethod} onValueChange={setArtMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    {IMPRINT_METHODS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>Cancel</Button>
            <Button
              disabled={createArtworkMutation.isPending || !pickedFile}
              onClick={() => {
                if (!pickedFile) return;
                createArtworkMutation.mutate({
                  orderItemId: pickedFile.orderItemId,
                  name: artName || pickedFile.fileName,
                  filePath: pickedFile.filePath,
                  fileName: pickedFile.fileName,
                  location: artLocation || undefined,
                  artworkType: artMethod || undefined,
                });
              }}
            >
              {createArtworkMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Adding...</>
              ) : (
                "Add Artwork"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
