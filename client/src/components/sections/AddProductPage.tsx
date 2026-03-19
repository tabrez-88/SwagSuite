import { useState, useCallback, useMemo } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, Search, Package, PenLine, Loader2, Plus,
  DollarSign, ShoppingCart, Trash2, ImageIcon, Tag, ShieldAlert
} from "lucide-react";
import type { ProjectData } from "@/types/project-types";
import { IMPRINT_LOCATIONS, IMPRINT_METHODS } from "@/constants/imprintOptions";
import { useMarginSettings, marginColorClass, isBelowMinimum, calcMarginPercent, applyMargin } from "@/hooks/useMarginSettings";

interface AddProductPageProps {
  orderId: string;
  data: ProjectData;
}

// Unified product result from any source
interface ProductResult {
  id: string;
  source: "sage" | "sanmar" | "ss_activewear" | "local" | "unified";
  name: string;
  sku?: string;
  description?: string;
  supplierName?: string;
  supplierId?: string;
  category?: string;
  imageUrl?: string;
  basePrice?: number;
  baseCost?: number;
  colors?: string[];
  sizes?: string[];
  minQuantity?: number;
  decorationMethods?: string[];
  rawData?: any;
}

// Line item for configuration dialog
interface ConfigLine {
  id: string;
  color: string;
  size: string;
  quantity: number;
  unitCost: number;
  unitPrice: number;
}

type SourceTab = "sage" | "sanmar" | "ss_activewear" | "catalog" | "manual";

// S&S CDN is behind Cloudflare — images can't be loaded directly or via proxy
// Store the raw URL for later Cloudinary caching on sync; display uses placeholder
function getSsImageUrl(product: any): string | undefined {
  const img = product.colorFrontImage || product.colorSideImage || product.colorSwatchImage || product.imageUrl;
  if (!img) return undefined;
  return img.startsWith('http') ? img : `https://www.ssactivewear.com/${img}`;
}

export default function AddProductPage({ orderId, data }: AddProductPageProps) {
  const marginSettings = useMarginSettings();
  const [currentLocation, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Detect context: project vs order, and which section we came from
  const isProjectContext = currentLocation.startsWith(`/project/`);
  const isPresentationContext = currentLocation.includes("/presentation/add");
  const isQuoteContext = currentLocation.includes("/quote/add");
  const productsPath = isProjectContext
    ? isPresentationContext
      ? `/project/${orderId}/presentation`
      : isQuoteContext
        ? `/project/${orderId}/quote`
        : `/project/${orderId}/sales-order`
    : `/orders/${orderId}/products`;

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<SourceTab>("catalog");
  const [searchResults, setSearchResults] = useState<ProductResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Configuration dialog
  const [selectedProduct, setSelectedProduct] = useState<ProductResult | null>(null);
  const [configLines, setConfigLines] = useState<ConfigLine[]>([]);
  const [productNotes, setProductNotes] = useState("");
  const [imprintLocation, setImprintLocation] = useState("");
  const [imprintMethod, setImprintMethod] = useState("");

  // Margin warning state
  const [marginWarningAction, setMarginWarningAction] = useState<(() => void) | null>(null);
  const [marginWarningValue, setMarginWarningValue] = useState<number>(0);

  // Vendor "Do Not Order" approval dialog state
  const [vendorBlockDialog, setVendorBlockDialog] = useState<{
    open: boolean;
    supplierId: string;
    supplierName: string;
    reason: string;
  }>({ open: false, supplierId: "", supplierName: "", reason: "" });
  const [approvalReason, setApprovalReason] = useState("");

  // Catalog: load all products for client-side filtering
  const [catalogFilter, setCatalogFilter] = useState("");
  const { data: allCatalogProducts = [], isLoading: isCatalogLoading } = useQuery<any[]>({
    queryKey: ["/api/products"],
    queryFn: async () => {
      const res = await fetch("/api/products");
      if (!res.ok) throw new Error("Failed to load catalog");
      return res.json();
    },
  });

  const filteredCatalogProducts = useMemo(() => {
    if (!catalogFilter.trim()) return allCatalogProducts;
    const lower = catalogFilter.toLowerCase();
    return allCatalogProducts.filter((p: any) => {
      const text = `${p.name || ''} ${p.sku || ''} ${p.description || ''} ${p.category || ''} ${p.supplierSku || ''}`.toLowerCase();
      return text.includes(lower);
    });
  }, [allCatalogProducts, catalogFilter]);

  // Brand lists for SanMar and S&S
  const SANMAR_BRANDS = [
    'Port Authority', 'Port & Company', 'Sport-Tek', 'CornerStone',
    'OGIO', 'Nike', 'TravisMathew', 'Brooks Brothers', 'Mercer+Mettle',
    'District', 'New Era', 'Carhartt', 'Eddie Bauer', 'The North Face',
    'Allmade', 'Bulwark', 'Red Kap', 'Volunteer Knitwear',
  ];

  const { data: ssBrands = [] } = useQuery<any[]>({
    queryKey: ["/api/ss-activewear/brands"],
    queryFn: async () => {
      const res = await fetch("/api/ss-activewear/brands");
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 30 * 60 * 1000, // cache 30min
  });

  // Manual entry state
  const [manualForm, setManualForm] = useState({
    productName: "",
    productSku: "",
    supplierName: "",
    quantity: 1,
    unitCost: 0,
    unitPrice: 0,
    color: "",
    size: "",
    notes: "",
    imprintLocation: "",
    imprintMethod: "",
  });

  // ── Per-supplier search functions ──
  const searchSage = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchError(null);
    setSearchResults([]);
    try {
      const res = await fetch("/api/integrations/sage/products?" + new URLSearchParams({ search: searchQuery }));
      if (!res.ok) throw new Error("SAGE search failed");
      const data = await res.json();
      const results: ProductResult[] = (data.products || []).map((p: any) => {
        let basePrice: number | undefined;
        if (p.pricingStructure) {
          if (typeof p.pricingStructure.minPrice === 'number') {
            basePrice = p.pricingStructure.minPrice;
          } else {
            const numericValues = Object.values(p.pricingStructure).filter((v): v is number => typeof v === 'number');
            if (numericValues.length > 0) basePrice = Math.min(...numericValues);
          }
        }
        return {
          id: p.productId || p.id || p.sageId,
          source: "sage" as const,
          name: p.productName,
          sku: p.productNumber,
          description: p.description,
          supplierName: p.supplierName,
          category: p.category,
          imageUrl: p.imageGallery?.[0],
          basePrice,
          colors: Array.isArray(p.colors) ? p.colors : [],
          sizes: Array.isArray(p.sizes) ? p.sizes : [],
          minQuantity: p.quantityBreaks?.[0],
          decorationMethods: p.decorationMethods || [],
          rawData: p,
        };
      });
      setSearchResults(results);
      if (results.length === 0) setSearchError("No SAGE products found for this keyword.");
    } catch {
      setSearchError("Failed to search SAGE. Check your credentials in Settings.");
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  const searchSanMar = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchError(null);
    setSearchResults([]);
    try {
      const res = await fetch("/api/sanmar/search?" + new URLSearchParams({ q: searchQuery }));
      if (!res.ok) throw new Error("SanMar search failed");
      const products = await res.json();
      const results: ProductResult[] = (Array.isArray(products) ? products : []).map((p: any) => ({
        id: p.styleId || p.id || `sanmar_${p.productId}`,
        source: "sanmar" as const,
        name: p.productTitle || p.styleName || p.productName,
        sku: p.styleId || p.productId,
        description: p.description || p.productDescription,
        supplierName: p.brandName || "SanMar",
        category: p.categoryName || p.category,
        imageUrl: p.productImage || p.thumbnailImage || p.frontFlat,
        basePrice: p.piecePrice || p.basePrice,
        baseCost: p.casePrice || p.baseCost,
        colors: p.colors || [],
        sizes: p.sizes || [],
        minQuantity: p.caseSize || 1,
        decorationMethods: [],
        rawData: p,
      }));
      setSearchResults(results);
      if (results.length === 0) setSearchError("No SanMar products found. Try a style number (PC54, G500) or brand name (Nike, OGIO).");
    } catch {
      setSearchError("Failed to search SanMar. Check your credentials in Settings.");
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  const searchSsActivewear = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchError(null);
    setSearchResults([]);
    try {
      const res = await fetch("/api/ss-activewear/search?" + new URLSearchParams({ q: searchQuery }));
      if (!res.ok) throw new Error("S&S search failed");
      const products = await res.json();
      const arr = Array.isArray(products) ? products : [];
      // Aggregate per-SKU entries into one result per style
      const styleMap = new Map<number, { base: any; colors: Set<string>; sizes: Set<string> }>();
      for (const p of arr) {
        const sid = p.styleID || 0;
        if (!styleMap.has(sid)) {
          styleMap.set(sid, { base: p, colors: new Set(), sizes: new Set() });
        }
        const entry = styleMap.get(sid)!;
        if (p.colorName) entry.colors.add(p.colorName);
        if (p.sizeName) entry.sizes.add(p.sizeName);
      }
      const results: ProductResult[] = [];
      for (const [, { base: p, colors, sizes }] of Array.from(styleMap.entries())) {
        results.push({
          id: `ss_${p.styleID}`,
          source: "ss_activewear",
          name: p.styleName || p.productName || p.title,
          sku: String(p.styleID || p.sku),
          description: p.description || `${p.brandName} ${p.styleName}`,
          supplierName: p.brandName || "S&S Activewear",
          category: p.category,
          imageUrl: getSsImageUrl(p),
          basePrice: p.customerPrice || p.piecePrice || p.basePrice,
          baseCost: p.casePrice || p.costPrice,
          colors: Array.from(colors),
          sizes: Array.from(sizes),
          minQuantity: 1,
          decorationMethods: [],
          rawData: p,
        });
      }
      setSearchResults(results);
      if (results.length === 0) setSearchError("No S&S Activewear products found for this search term.");
    } catch {
      setSearchError("Failed to search S&S Activewear. Check your credentials in Settings.");
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  // Catalog uses client-side filtering — no searchCatalog callback needed

  // ── Handle Search per tab ──
  const handleSearch = useCallback(() => {
    switch (activeTab) {
      case "sage": return searchSage();
      case "sanmar": return searchSanMar();
      case "ss_activewear": return searchSsActivewear();
    }
  }, [activeTab, searchSage, searchSanMar, searchSsActivewear]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  // ── Sync to catalog before opening config ──
  const syncAndOpenConfig = async (product: ProductResult) => {
    // Local catalog products don't need syncing
    if (product.source === "local") {
      openProductConfig(product);
      return;
    }

    setIsSyncing(true);
    try {
      const res = await fetch("/api/products/sync-from-supplier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: product.name,
          sku: product.sku,
          supplierName: product.supplierName || "Unknown",
          description: product.description,
          basePrice: product.basePrice,
          category: product.category,
          colors: product.colors,
          sizes: product.sizes,
          imageUrl: product.imageUrl,
          source: product.source,
        }),
      });

      if (!res.ok) throw new Error("Sync failed");
      const { product: catalogProduct, supplier, isNew } = await res.json();

      if (isNew) {
        toast({ title: `Product "${product.name}" added to catalog`, description: `Vendor: ${supplier.name}` });
      }

      // Invalidate product queries so catalog is up to date
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });

      // Open config with synced product data (keeps supplier colors/sizes from API)
      openProductConfig({
        ...product,
        id: catalogProduct.id,
        supplierName: supplier.name,
      });
    } catch {
      toast({ title: "Sync failed", description: "Could not sync product to catalog. Adding directly.", variant: "destructive" });
      openProductConfig(product);
    } finally {
      setIsSyncing(false);
    }
  };

  // ── Select Product → Open Config Dialog ──
  const openProductConfig = (product: ProductResult) => {
    setSelectedProduct(product);
    setProductNotes("");
    setImprintLocation("");
    setImprintMethod("");

    const defaultCost = product.baseCost || 0;
    const defaultPrice = product.basePrice || 0;
    setConfigLines([{
      id: crypto.randomUUID(),
      color: product.colors?.[0] || "",
      size: product.sizes?.[0] || "",
      quantity: product.minQuantity || 1,
      unitCost: defaultCost,
      unitPrice: defaultPrice,
    }]);
  };

  // ── Config Line Management ──
  const addConfigLine = () => {
    if (!selectedProduct) return;
    setConfigLines(prev => [...prev, {
      id: crypto.randomUUID(),
      color: "",
      size: "",
      quantity: 1,
      unitCost: selectedProduct.baseCost || 0,
      unitPrice: selectedProduct.basePrice || 0,
    }]);
  };

  const updateConfigLine = (id: string, field: keyof ConfigLine, value: any) => {
    setConfigLines(prev => prev.map(line =>
      line.id === id ? { ...line, [field]: value } : line
    ));
  };

  const updateConfigLineMulti = (id: string, updates: Partial<ConfigLine>) => {
    setConfigLines(prev => prev.map(line =>
      line.id === id ? { ...line, ...updates } : line
    ));
  };

  const removeConfigLine = (id: string) => {
    setConfigLines(prev => prev.filter(l => l.id !== id));
  };

  // ── Add Product Mutation ──
  const addProductMutation = useMutation({
    mutationFn: async (payload: {
      product: ProductResult;
      lines: ConfigLine[];
      notes: string;
      imprintLocation: string;
      imprintMethod: string;
    }) => {
      const { product, lines, notes, imprintLocation, imprintMethod } = payload;

      const totalQty = lines.reduce((sum, l) => sum + l.quantity, 0);
      const totalCost = lines.reduce((sum, l) => sum + l.quantity * l.unitCost, 0);
      const totalPrice = lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);
      const avgUnitPrice = totalQty > 0 ? totalPrice / totalQty : 0;
      const avgUnitCost = totalQty > 0 ? totalCost / totalQty : 0;

      const sizePricing: Record<string, any> = {};
      lines.forEach(l => {
        const key = [l.color, l.size].filter(Boolean).join(" / ") || "Default";
        sizePricing[key] = { cost: l.unitCost, price: l.unitPrice, quantity: l.quantity };
      });

      // 1. Create the order item
      const itemRes = await fetch(`/api/orders/${orderId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id, // Link to catalog product for name/SKU via JOIN
          quantity: totalQty,
          cost: avgUnitCost.toFixed(2),
          unitPrice: avgUnitPrice.toFixed(2),
          totalPrice: totalPrice.toFixed(2),
          decorationCost: "0",
          charges: "0",
          color: lines.length === 1 ? lines[0].color : "",
          size: lines.length === 1 ? lines[0].size : "",
          imprintLocation,
          imprintMethod,
          notes,
          sizePricing,
        }),
      });

      if (!itemRes.ok) {
        const err = await itemRes.json().catch(() => ({}));
        if (itemRes.status === 403 && err.doNotOrder) {
          // Throw a special error so onError can show the dialog
          const e = new Error(err.message || "Vendor is blocked") as any;
          e.doNotOrder = true;
          e.supplierId = err.supplierId;
          e.supplierName = err.supplierName;
          throw e;
        }
        throw new Error(err.message || "Failed to create order item");
      }

      const createdItem = await itemRes.json();

      // 2. Create order item lines (size/color breakdown)
      if (lines.length > 0) {
        await Promise.all(
          lines.map(line =>
            fetch(`/api/order-items/${createdItem.id}/lines`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orderItemId: createdItem.id,
                color: line.color,
                size: line.size,
                quantity: line.quantity,
                cost: line.unitCost.toFixed(2),
                unitPrice: line.unitPrice.toFixed(2),
                totalPrice: (line.quantity * line.unitPrice).toFixed(2),
                margin: line.unitPrice > 0
                  ? (((line.unitPrice - line.unitCost) / line.unitPrice) * 100).toFixed(2)
                  : "0",
              }),
            })
          )
        );
      }

      return createdItem;
    },
    onSuccess: () => {
      toast({ title: "Product added to order" });
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}/items`] });
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}/all-item-lines`] });
      setSelectedProduct(null);
      setLocation(productsPath);
    },
    onError: (err: any) => {
      if (err.doNotOrder) {
        setVendorBlockDialog({
          open: true,
          supplierId: err.supplierId,
          supplierName: err.supplierName,
          reason: err.message,
        });
        return;
      }
      toast({ title: "Failed to add product", description: err.message, variant: "destructive" });
    },
  });

  // ── Vendor Approval Request Mutation ──
  const vendorApprovalMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/vendor-approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          supplierId: vendorBlockDialog.supplierId,
          orderId,
          reason: approvalReason || `Requesting approval to order from ${vendorBlockDialog.supplierName} for this project.`,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to submit approval request");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Approval request sent", description: "An admin will be notified to review your request." });
      setVendorBlockDialog({ open: false, supplierId: "", supplierName: "", reason: "" });
      setApprovalReason("");
    },
    onError: (err: any) => {
      toast({ title: "Failed to send approval request", description: err.message, variant: "destructive" });
    },
  });

  // ── Manual Entry Mutation ──
  const addManualProductMutation = useMutation({
    mutationFn: async () => {
      // Sync manual product to catalog to get productId
      let productId: string | undefined;
      if (manualForm.productName) {
        try {
          const syncRes = await fetch("/api/products/sync-from-supplier", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: manualForm.productName,
              sku: manualForm.productSku,
              supplierName: manualForm.supplierName || "Manual Entry",
              basePrice: manualForm.unitPrice,
              source: "manual",
            }),
          });
          if (syncRes.ok) {
            const { product: catalogProduct } = await syncRes.json();
            productId = catalogProduct.id;
          }
        } catch { /* proceed without productId */ }
      }

      const totalPrice = manualForm.quantity * manualForm.unitPrice;

      const res = await fetch(`/api/orders/${orderId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          quantity: manualForm.quantity,
          cost: manualForm.unitCost.toFixed(2),
          unitPrice: manualForm.unitPrice.toFixed(2),
          totalPrice: totalPrice.toFixed(2),
          decorationCost: "0",
          charges: "0",
          color: manualForm.color,
          size: manualForm.size,
          imprintLocation: manualForm.imprintLocation,
          imprintMethod: manualForm.imprintMethod,
          notes: manualForm.notes,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (res.status === 403 && err.doNotOrder) {
          const e = new Error(err.message || "Vendor is blocked") as any;
          e.doNotOrder = true;
          e.supplierId = err.supplierId;
          e.supplierName = err.supplierName;
          throw e;
        }
        throw new Error(err.message || "Failed to create product");
      }

      const createdItem = await res.json();

      if (manualForm.color || manualForm.size) {
        await fetch(`/api/order-items/${createdItem.id}/lines`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderItemId: createdItem.id,
            color: manualForm.color,
            size: manualForm.size,
            quantity: manualForm.quantity,
            cost: manualForm.unitCost.toFixed(2),
            unitPrice: manualForm.unitPrice.toFixed(2),
            totalPrice: totalPrice.toFixed(2),
            margin: manualForm.unitPrice > 0
              ? (((manualForm.unitPrice - manualForm.unitCost) / manualForm.unitPrice) * 100).toFixed(2)
              : "0",
          }),
        });
      }

      return createdItem;
    },
    onSuccess: () => {
      toast({ title: "Product added to order" });
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}/items`] });
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}`] });
      setLocation(productsPath);
    },
    onError: (err: any) => {
      if (err.doNotOrder) {
        setVendorBlockDialog({
          open: true,
          supplierId: err.supplierId,
          supplierName: err.supplierName,
          reason: err.message,
        });
        return;
      }
      toast({ title: "Failed to add product", description: err.message, variant: "destructive" });
    },
  });

  // ── Computed Values ──
  const configTotalQty = configLines.reduce((s, l) => s + l.quantity, 0);
  const configTotalCost = configLines.reduce((s, l) => s + l.quantity * l.unitCost, 0);
  const configTotalPrice = configLines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
  const configMargin = configTotalPrice > 0
    ? ((configTotalPrice - configTotalCost) / configTotalPrice * 100)
    : 0;

  const sourceLabel = (s: string) => {
    switch (s) {
      case "sage": return "SAGE";
      case "sanmar": return "SanMar";
      case "ss_activewear": return "S&S Activewear";
      case "local": return "Local Catalog";
      default: return s;
    }
  };

  const sourceBadgeColor = (s: string) => {
    switch (s) {
      case "sage": return "bg-green-100 text-green-800";
      case "sanmar": return "bg-blue-100 text-blue-800";
      case "ss_activewear": return "bg-purple-100 text-purple-800";
      case "local": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // ── Shared search input renderer ──
  function renderSearchInput(placeholder: string, hint: string) {
    return (
      <Card>
        <CardContent className="pt-5 space-y-3">
          <div className="flex gap-2">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={isSearching || !searchQuery.trim()}>
              {isSearching ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
              Search
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">{hint}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation(productsPath)}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Products
        </Button>
        <h2 className="text-xl font-semibold">Add Product to Order</h2>
      </div>

      {/* Syncing overlay */}
      {isSyncing && (
        <Card>
          <CardContent className="py-6 text-center">
            <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin text-blue-500" />
            <p className="text-sm text-gray-500">Syncing product to catalog...</p>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={(v) => {
        setActiveTab(v as SourceTab);
        setSearchResults([]);
        setSearchError(null);
        setSearchQuery("");
      }}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="catalog" className="text-xs sm:text-sm">
            <Package className="w-3.5 h-3.5 mr-1 hidden sm:inline" />
            Catalog
          </TabsTrigger>
          <TabsTrigger value="sage" className="text-xs sm:text-sm">
            SAGE
          </TabsTrigger>
          <TabsTrigger value="sanmar" className="text-xs sm:text-sm">
            SanMar
          </TabsTrigger>
          <TabsTrigger value="ss_activewear" className="text-xs sm:text-sm">
            S&S
          </TabsTrigger>
          <TabsTrigger value="manual" className="text-xs sm:text-sm">
            <PenLine className="w-3.5 h-3.5 mr-1 hidden sm:inline" />
            Manual
          </TabsTrigger>
        </TabsList>

        {/* ═══ LOCAL CATALOG TAB (client-side filtering) ═══ */}
        <TabsContent value="catalog" className="space-y-4">
          <Card>
            <CardContent className="pt-5 space-y-3">
              <Input
                value={catalogFilter}
                onChange={(e) => setCatalogFilter(e.target.value)}
                placeholder="Filter by name, SKU, or description..."
                className="flex-1"
              />
              <p className="text-xs text-muted-foreground">
                Showing {filteredCatalogProducts.length} of {allCatalogProducts.length} products in your catalog. Type to filter instantly.
              </p>
            </CardContent>
          </Card>
          {isCatalogLoading ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Loader2 className="w-6 h-6 mx-auto mb-2 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Loading catalog...</p>
              </CardContent>
            </Card>
          ) : filteredCatalogProducts.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Package className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {allCatalogProducts.length === 0
                    ? "No products in catalog yet. Add products from suppliers or use Manual entry."
                    : `No products match "${catalogFilter}".`}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredCatalogProducts.slice(0, 50).map((p: any) => {
                const product: ProductResult = {
                  id: p.id,
                  source: "local",
                  name: p.name || p.productName,
                  sku: p.sku,
                  description: p.description,
                  supplierName: data.suppliers?.find((s: any) => s.id === p.supplierId)?.name || "Unknown",
                  supplierId: p.supplierId,
                  category: p.category,
                  imageUrl: p.imageUrl,
                  basePrice: p.basePrice ? parseFloat(p.basePrice) : undefined,
                  baseCost: p.baseCost ? parseFloat(p.baseCost) : undefined,
                  colors: p.colors || [],
                  sizes: p.sizes || [],
                  rawData: p,
                };
                return (
                  <Card
                    key={product.id}
                    className="cursor-pointer hover:border-blue-300 hover:shadow-sm transition-all"
                    onClick={() => syncAndOpenConfig(product)}
                  >
                    <CardContent className="p-4">
                      <div className="flex gap-3">
                        {product.imageUrl && product.source !== 'ss_activewear' ? (
                          <img src={product.imageUrl} alt={product.name} className="w-16 h-16 object-contain rounded border bg-white flex-shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        ) : product.source === 'ss_activewear' ? (
                          <div className="w-16 h-16 bg-blue-50 rounded border border-blue-200 flex items-center justify-center flex-shrink-0">
                            <span className="text-[10px] font-bold text-blue-600 text-center leading-tight">S&S</span>
                          </div>
                        ) : (
                          <div className="w-16 h-16 bg-gray-100 rounded border flex items-center justify-center flex-shrink-0">
                            <ImageIcon className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">{product.name}</h4>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {product.sku && <Badge variant="outline" className="text-xs"><Tag className="w-3 h-3 mr-1" />{product.sku}</Badge>}
                            <Badge className="text-xs bg-gray-100 text-gray-800">{product.supplierName}</Badge>
                          </div>
                          {product.basePrice && (
                            <p className="text-sm font-medium text-green-700 mt-1">
                              <DollarSign className="w-3 h-3 inline" />{product.basePrice.toFixed(2)}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {filteredCatalogProducts.length > 50 && (
                <p className="text-xs text-muted-foreground col-span-full text-center py-2">
                  Showing first 50 of {filteredCatalogProducts.length} results. Refine your filter to see more.
                </p>
              )}
            </div>
          )}
        </TabsContent>

        {/* ═══ SAGE TAB ═══ */}
        <TabsContent value="sage" className="space-y-4">
          {renderSearchInput(
            "Search keywords, product name, or item number...",
            "SAGE supports full keyword search across all promotional products (pens, bags, mugs, etc.)"
          )}
          {renderSearchResults()}
        </TabsContent>

        {/* ═══ SANMAR TAB ═══ */}
        <TabsContent value="sanmar" className="space-y-4">
          {renderSearchInput(
            "Style number (PC54, G500, DT6000) or brand name...",
            "SanMar works best with style numbers or exact brand names. Click a brand below to search."
          )}
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs font-medium text-muted-foreground mb-2">Quick Brand Search</p>
              <div className="flex flex-wrap gap-1.5">
                {SANMAR_BRANDS.map((brand) => (
                  <Badge
                    key={brand}
                    variant="outline"
                    className="cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-colors text-xs px-2.5 py-1"
                    onClick={() => {
                      setSearchQuery(brand);
                      // Trigger search after setting query
                      setTimeout(() => {
                        setIsSearching(true);
                        setSearchError(null);
                        setSearchResults([]);
                        fetch("/api/sanmar/search?" + new URLSearchParams({ q: brand }))
                          .then(r => r.ok ? r.json() : Promise.reject())
                          .then(products => {
                            const arr = Array.isArray(products) ? products : [];
                            const results: ProductResult[] = arr.map((p: any) => ({
                              id: p.styleId || p.id || `sanmar_${p.productId}`,
                              source: "sanmar" as const,
                              name: p.productTitle || p.styleName || p.productName,
                              sku: p.styleId || p.productId,
                              description: p.description || p.productDescription,
                              supplierName: p.brandName || "SanMar",
                              category: p.categoryName || p.category,
                              imageUrl: p.productImage || p.thumbnailImage || p.frontFlat,
                              basePrice: p.piecePrice || p.basePrice,
                              baseCost: p.casePrice || p.baseCost,
                              colors: p.colors || [],
                              sizes: p.sizes || [],
                              minQuantity: p.caseSize || 1,
                              decorationMethods: [],
                              rawData: p,
                            }));
                            setSearchResults(results);
                            if (results.length === 0) setSearchError(`No SanMar products found for "${brand}".`);
                          })
                          .catch(() => setSearchError("Failed to search SanMar."))
                          .finally(() => setIsSearching(false));
                      }, 0);
                    }}
                  >
                    {brand}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
          {renderSearchResults()}
        </TabsContent>

        {/* ═══ S&S ACTIVEWEAR TAB ═══ */}
        <TabsContent value="ss_activewear" className="space-y-4">
          {renderSearchInput(
            "Keyword (polo, hoodie), style number, or brand name...",
            "S&S Activewear supports keyword search, style numbers, and brand names. Click a brand below to search."
          )}
          {ssBrands.length > 0 && (
            <Card>
              <CardContent className="pt-4 pb-3">
                <p className="text-xs font-medium text-muted-foreground mb-2">Quick Brand Search ({ssBrands.length} brands)</p>
                <ScrollArea className="max-h-32">
                  <div className="flex flex-wrap gap-1.5">
                    {ssBrands.map((brand: any) => (
                      <Badge
                        key={brand.brandId || brand.id || brand.brandName}
                        variant="outline"
                        className="cursor-pointer hover:bg-purple-50 hover:border-purple-300 transition-colors text-xs px-2.5 py-1"
                        onClick={() => {
                          const brandName = brand.brandName || brand.name;
                          setSearchQuery(brandName);
                          setTimeout(() => {
                            setIsSearching(true);
                            setSearchError(null);
                            setSearchResults([]);
                            fetch("/api/ss-activewear/search?" + new URLSearchParams({ q: brandName }))
                              .then(r => r.ok ? r.json() : Promise.reject())
                              .then(products => {
                                const arr = Array.isArray(products) ? products : [];
                                const styleMap = new Map<number, { base: any; colors: Set<string>; sizes: Set<string> }>();
                                for (const p of arr) {
                                  const sid = p.styleID || 0;
                                  if (!styleMap.has(sid)) styleMap.set(sid, { base: p, colors: new Set(), sizes: new Set() });
                                  const entry = styleMap.get(sid)!;
                                  if (p.colorName) entry.colors.add(p.colorName);
                                  if (p.sizeName) entry.sizes.add(p.sizeName);
                                }
                                const results: ProductResult[] = [];
                                for (const [, { base: p, colors, sizes }] of Array.from(styleMap.entries())) {
                                  results.push({
                                    id: `ss_${p.styleID}`,
                                    source: "ss_activewear",
                                    name: p.styleName || p.productName || p.title,
                                    sku: String(p.styleID || p.sku),
                                    description: p.description || `${p.brandName} ${p.styleName}`,
                                    supplierName: p.brandName || "S&S Activewear",
                                    category: p.category,
                                    imageUrl: getSsImageUrl(p),
                                    basePrice: p.customerPrice || p.piecePrice || p.basePrice,
                                    baseCost: p.casePrice || p.costPrice,
                                    colors: Array.from(colors),
                                    sizes: Array.from(sizes),
                                    minQuantity: 1,
                                    decorationMethods: [],
                                    rawData: p,
                                  });
                                }
                                setSearchResults(results);
                                if (results.length === 0) setSearchError(`No S&S products found for "${brandName}".`);
                              })
                              .catch(() => setSearchError("Failed to search S&S Activewear."))
                              .finally(() => setIsSearching(false));
                          }, 0);
                        }}
                      >
                        {brand.brandName || brand.name}
                      </Badge>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
          {renderSearchResults()}
        </TabsContent>

        {/* ═══ MANUAL ENTRY TAB ═══ */}
        <TabsContent value="manual" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Manual Product Entry</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <Label>Product Name *</Label>
                  <Input
                    value={manualForm.productName}
                    onChange={(e) => setManualForm(f => ({ ...f, productName: e.target.value }))}
                    placeholder="e.g., Custom Printed T-Shirt"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <Label>SKU / Style Number</Label>
                  <Input
                    value={manualForm.productSku}
                    onChange={(e) => setManualForm(f => ({ ...f, productSku: e.target.value }))}
                    placeholder="e.g., TSH-001"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <Label>Supplier / Vendor Name</Label>
                  <Input
                    value={manualForm.supplierName}
                    onChange={(e) => setManualForm(f => ({ ...f, supplierName: e.target.value }))}
                    placeholder="e.g., Alpha Broder"
                  />
                </div>
                <div>
                  <Label>Quantity *</Label>
                  <Input
                    type="number"
                    min={1}
                    value={manualForm.quantity}
                    onChange={(e) => setManualForm(f => ({ ...f, quantity: parseInt(e.target.value) || 1 }))}
                  />
                </div>
                <div>
                  <Label>Unit Cost (your cost)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    value={manualForm.unitCost}
                    onChange={(e) => {
                      const newCost = parseFloat(e.target.value) || 0;
                      setManualForm(f => {
                        // Auto-update price to preserve margin when cost changes
                        if (newCost > 0 && f.unitPrice > 0) {
                          const currentMargin = calcMarginPercent(f.unitCost, f.unitPrice);
                          if (currentMargin > 0 && currentMargin < 100) {
                            const { price } = applyMargin(newCost, 0, currentMargin);
                            return { ...f, unitCost: newCost, unitPrice: price };
                          }
                        }
                        return { ...f, unitCost: newCost };
                      });
                    }}
                  />
                </div>
                <div>
                  <Label>Unit Price (sell price) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    value={manualForm.unitPrice}
                    onChange={(e) => setManualForm(f => ({ ...f, unitPrice: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <Label>Margin %</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      step="0.1"
                      min={0}
                      max={99.9}
                      className={`pr-7 ${isBelowMinimum(calcMarginPercent(manualForm.unitCost, manualForm.unitPrice), marginSettings) ? "border-red-300 text-red-600" : ""}`}
                      value={parseFloat(calcMarginPercent(manualForm.unitCost, manualForm.unitPrice).toFixed(1))}
                      onChange={(e) => {
                        const targetMargin = parseFloat(e.target.value) || 0;
                        const result = applyMargin(manualForm.unitCost, manualForm.unitPrice, targetMargin);
                        setManualForm(f => ({ ...f, unitCost: result.cost, unitPrice: result.price }));
                      }}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
                  </div>
                  {manualForm.unitCost === 0 && manualForm.unitPrice === 0 && (
                    <p className="text-[10px] text-gray-400 mt-1">Enter cost or price first to use margin</p>
                  )}
                </div>
                <div>
                  <Label>Color</Label>
                  <Input
                    value={manualForm.color}
                    onChange={(e) => setManualForm(f => ({ ...f, color: e.target.value }))}
                    placeholder="e.g., Navy Blue"
                  />
                </div>
                <div>
                  <Label>Size</Label>
                  <Input
                    value={manualForm.size}
                    onChange={(e) => setManualForm(f => ({ ...f, size: e.target.value }))}
                    placeholder="e.g., L, XL"
                  />
                </div>
                <div>
                  <Label>Imprint Location</Label>
                  <Select value={manualForm.imprintLocation} onValueChange={(v) => setManualForm(f => ({ ...f, imprintLocation: v }))}>
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
                  <Select value={manualForm.imprintMethod} onValueChange={(v) => setManualForm(f => ({ ...f, imprintMethod: v }))}>
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
                <div className="col-span-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={manualForm.notes}
                    onChange={(e) => setManualForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="Additional product notes..."
                    rows={3}
                  />
                </div>

                {/* Manual Summary */}
                {manualForm.unitPrice > 0 && (
                  <div className="col-span-2 rounded-lg bg-gray-50 p-4 flex items-center gap-6 text-sm">
                    <div>
                      <span className="text-gray-500">Total:</span>{" "}
                      <span className="font-semibold">${(manualForm.quantity * manualForm.unitPrice).toFixed(2)}</span>
                    </div>
                    {manualForm.unitCost > 0 && (() => {
                      const m = ((manualForm.unitPrice - manualForm.unitCost) / manualForm.unitPrice) * 100;
                      return (
                        <div>
                          <span className="text-gray-500">Margin:</span>{" "}
                          <span className={`font-semibold ${marginColorClass(m, marginSettings)}`}>
                            {m.toFixed(1)}%
                          </span>
                          {isBelowMinimum(m, marginSettings) && (
                            <span className="ml-2 text-red-500 text-xs">Below min ({marginSettings.minimumMargin}%)</span>
                          )}
                        </div>
                      );
                    })()}
                    {manualForm.unitCost > 0 && (
                      <div>
                        <span className="text-gray-500">Profit:</span>{" "}
                        <span className="font-semibold text-green-700">
                          ${((manualForm.unitPrice - manualForm.unitCost) * manualForm.quantity).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <div className="col-span-2 flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setLocation(productsPath)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      if (manualForm.unitCost > 0) {
                        const m = ((manualForm.unitPrice - manualForm.unitCost) / manualForm.unitPrice) * 100;
                        if (isBelowMinimum(m, marginSettings)) {
                          setMarginWarningValue(m);
                          setMarginWarningAction(() => () => addManualProductMutation.mutate());
                          return;
                        }
                      }
                      addManualProductMutation.mutate();
                    }}
                    disabled={!manualForm.productName || manualForm.unitPrice <= 0 || addManualProductMutation.isPending}
                  >
                    {addManualProductMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4 mr-2" />
                    )}
                    Add Product
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ═══ PRODUCT CONFIGURATION DIALOG ═══ */}
      <Dialog open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Configure Product
            </DialogTitle>
          </DialogHeader>

          {selectedProduct && (
            <div className="space-y-6">
              {/* Product Summary */}
              <div className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                {selectedProduct.imageUrl ? (
                  <img
                    src={selectedProduct.imageUrl}
                    alt={selectedProduct.name}
                    className="w-20 h-20 object-contain rounded border bg-white"
                  />
                ) : (
                  <div className="w-20 h-20 bg-gray-200 rounded border flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{selectedProduct.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {selectedProduct.sku && (
                      <Badge variant="outline" className="text-xs">
                        <Tag className="w-3 h-3 mr-1" />
                        {selectedProduct.sku}
                      </Badge>
                    )}
                    <Badge className={`text-xs ${sourceBadgeColor(selectedProduct.source)}`}>
                      {sourceLabel(selectedProduct.source)}
                    </Badge>
                    {selectedProduct.supplierName && (
                      <span className="text-sm text-gray-500">{selectedProduct.supplierName}</span>
                    )}
                  </div>
                  {selectedProduct.description && (
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">{selectedProduct.description}</p>
                  )}
                </div>
              </div>

              {/* Imprint Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Imprint Location</Label>
                  <Select value={imprintLocation} onValueChange={setImprintLocation}>
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
                  {selectedProduct.decorationMethods && selectedProduct.decorationMethods.length > 0 ? (
                    <Select value={imprintMethod} onValueChange={setImprintMethod}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedProduct.decorationMethods.map((m: string) => (
                          <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Select value={imprintMethod} onValueChange={setImprintMethod}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                      <SelectContent>
                        {IMPRINT_METHODS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              {/* Size/Color Line Items */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-base font-semibold">Size & Color Breakdown</Label>
                  <Button variant="outline" size="sm" onClick={addConfigLine}>
                    <Plus className="w-3 h-3 mr-1" />
                    Add Line
                  </Button>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="text-left p-3 font-medium">Color</th>
                        <th className="text-left p-3 font-medium">Size</th>
                        <th className="text-right p-3 font-medium w-24">Qty</th>
                        <th className="text-right p-3 font-medium w-28">Unit Cost</th>
                        <th className="text-right p-3 font-medium w-28">Unit Price</th>
                        <th className="text-right p-3 font-medium w-24">Margin</th>
                        <th className="text-right p-3 font-medium w-28">Line Total</th>
                        <th className="w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {configLines.map((line) => {
                        const lineTotal = line.quantity * line.unitPrice;
                        const lineMargin = calcMarginPercent(line.unitCost, line.unitPrice);
                        return (
                          <tr key={line.id} className={`border-b last:border-0 ${isBelowMinimum(lineMargin, marginSettings) ? "bg-red-50/30" : ""}`}>
                            <td className="p-2">
                              <>
                                <Input
                                  className="h-8 text-xs"
                                  value={line.color}
                                  onChange={(e) => updateConfigLine(line.id, "color", e.target.value)}
                                  placeholder="Color"
                                  list={`colors-${line.id}`}
                                />
                                {selectedProduct.colors && selectedProduct.colors.length > 0 && (
                                  <datalist id={`colors-${line.id}`}>
                                    {selectedProduct.colors.map(c => (
                                      <option key={c} value={c} />
                                    ))}
                                  </datalist>
                                )}
                              </>
                            </td>
                            <td className="p-2">
                              <>
                                <Input
                                  className="h-8 text-xs"
                                  value={line.size}
                                  onChange={(e) => updateConfigLine(line.id, "size", e.target.value)}
                                  placeholder="Size"
                                  list={`sizes-${line.id}`}
                                />
                                {selectedProduct.sizes && selectedProduct.sizes.length > 0 && (
                                  <datalist id={`sizes-${line.id}`}>
                                    {selectedProduct.sizes.map(s => (
                                      <option key={s} value={s} />
                                    ))}
                                  </datalist>
                                )}
                              </>
                            </td>
                            <td className="p-2">
                              <Input
                                className="h-8 text-xs text-right"
                                type="number"
                                min={1}
                                value={line.quantity}
                                onChange={(e) => updateConfigLine(line.id, "quantity", parseInt(e.target.value) || 0)}
                              />
                            </td>
                            <td className="p-2">
                              <Input
                                className="h-8 text-xs text-right"
                                type="number"
                                step="0.01"
                                min={0}
                                value={line.unitCost}
                                onChange={(e) => {
                                  const newCost = parseFloat(e.target.value) || 0;
                                  // Auto-update price to preserve margin when cost changes
                                  if (newCost > 0 && line.unitPrice > 0) {
                                    const currentMargin = calcMarginPercent(line.unitCost, line.unitPrice);
                                    if (currentMargin > 0 && currentMargin < 100) {
                                      const { price } = applyMargin(newCost, 0, currentMargin);
                                      updateConfigLineMulti(line.id, { unitCost: newCost, unitPrice: price });
                                      return;
                                    }
                                  }
                                  updateConfigLine(line.id, "unitCost", newCost);
                                }}
                              />
                            </td>
                            <td className="p-2">
                              <Input
                                className="h-8 text-xs text-right"
                                type="number"
                                step="0.01"
                                min={0}
                                value={line.unitPrice}
                                onChange={(e) => updateConfigLine(line.id, "unitPrice", parseFloat(e.target.value) || 0)}
                              />
                            </td>
                            <td className="p-2">
                              <div className="relative">
                                <Input
                                  className={`h-8 text-xs text-right pr-5 ${isBelowMinimum(lineMargin, marginSettings) ? "border-red-300 text-red-600" : ""}`}
                                  type="number"
                                  step="0.1"
                                  min={0}
                                  max={99.9}
                                  value={parseFloat(lineMargin.toFixed(1))}
                                  onChange={(e) => {
                                    const targetMargin = parseFloat(e.target.value) || 0;
                                    const result = applyMargin(line.unitCost, line.unitPrice, targetMargin);
                                    updateConfigLineMulti(line.id, { unitCost: result.cost, unitPrice: result.price });
                                  }}
                                />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">%</span>
                              </div>
                            </td>
                            <td className="p-2 text-right">
                              <span className={`text-xs font-medium ${marginColorClass(lineMargin, marginSettings)}`}>${lineTotal.toFixed(2)}</span>
                            </td>
                            <td className="p-2">
                              {configLines.length > 1 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0"
                                  onClick={() => removeConfigLine(line.id)}
                                >
                                  <Trash2 className="w-3 h-3 text-red-500" />
                                </Button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-gray-50 border-t">
                      <tr>
                        <td colSpan={2} className="p-3 text-sm font-semibold">Totals</td>
                        <td className="p-3 text-right text-sm font-semibold">{configTotalQty}</td>
                        <td className="p-3 text-right text-sm text-gray-500">${configTotalCost.toFixed(2)}</td>
                        <td className="p-3"></td>
                        <td className="p-3 text-right">
                          <span className={`text-sm font-semibold ${marginColorClass(configMargin, marginSettings)}`}>
                            {configMargin.toFixed(1)}%
                          </span>
                        </td>
                        <td className="p-3 text-right text-sm font-semibold">${configTotalPrice.toFixed(2)}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Minimum Margin Warning */}
              {isBelowMinimum(configMargin, marginSettings) && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 flex items-center gap-2 text-sm text-red-700">
                  <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                  <span>
                    Margin ({configMargin.toFixed(1)}%) is below the company minimum of {marginSettings.minimumMargin}%.
                    Adding this product will require confirmation.
                  </span>
                </div>
              )}

              {/* Notes */}
              <div>
                <Label>Product Notes</Label>
                <Textarea
                  value={productNotes}
                  onChange={(e) => setProductNotes(e.target.value)}
                  placeholder="Special instructions, decoration details, etc."
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedProduct(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!selectedProduct) return;
                const doAdd = () => addProductMutation.mutate({
                  product: selectedProduct,
                  lines: configLines,
                  notes: productNotes,
                  imprintLocation,
                  imprintMethod,
                });
                if (isBelowMinimum(configMargin, marginSettings)) {
                  setMarginWarningValue(configMargin);
                  setMarginWarningAction(() => doAdd);
                  return;
                }
                doAdd();
              }}
              disabled={addProductMutation.isPending || configLines.length === 0 || configTotalQty === 0}
            >
              {addProductMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <DollarSign className="w-4 h-4 mr-2" />
              )}
              Add to Order — ${configTotalPrice.toFixed(2)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Vendor "Do Not Order" Approval Request Dialog */}
      <AlertDialog
        open={vendorBlockDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setVendorBlockDialog({ open: false, supplierId: "", supplierName: "", reason: "" });
            setApprovalReason("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-500" />
              Vendor Not Approved
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  <span className="font-semibold">{vendorBlockDialog.supplierName}</span> is currently marked as "Do Not Order."
                  You cannot add products from this vendor without admin approval.
                </p>
                <p>
                  Would you like to send an approval request to an administrator?
                </p>
                <div className="pt-1">
                  <Label htmlFor="approval-reason" className="text-sm font-medium">Reason (optional)</Label>
                  <Textarea
                    id="approval-reason"
                    placeholder="Explain why you need to order from this vendor..."
                    value={approvalReason}
                    onChange={(e) => setApprovalReason(e.target.value)}
                    className="mt-1"
                    rows={3}
                  />
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={vendorApprovalMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                vendorApprovalMutation.mutate();
              }}
              disabled={vendorApprovalMutation.isPending}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {vendorApprovalMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Request Approval
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ═══ MARGIN WARNING CONFIRMATION DIALOG ═══ */}
      <AlertDialog open={!!marginWarningAction} onOpenChange={(open) => { if (!open) { setMarginWarningAction(null); setMarginWarningValue(0); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <ShieldAlert className="w-5 h-5" />
              Below Minimum Margin
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <p>
                  The margin for this product is <strong className="text-red-600">{marginWarningValue.toFixed(1)}%</strong>, which is below
                  the company minimum of <strong>{marginSettings.minimumMargin}%</strong>.
                </p>
                <p className="mt-2 text-orange-600 font-medium">
                  Are you sure you want to add this product with a below-minimum margin?
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setMarginWarningAction(null); setMarginWarningValue(0); }}>
              Go Back & Adjust
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (marginWarningAction) marginWarningAction();
                setMarginWarningAction(null);
                setMarginWarningValue(0);
              }}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Add Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );

  // ── Shared search results renderer ──
  function renderSearchResults() {
    if (isSearching) {
      return (
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="w-10 h-10 mx-auto mb-3 animate-spin text-blue-500" />
            <p className="text-gray-500">
              Searching {activeTab === "sage" ? "SAGE" : activeTab === "sanmar" ? "SanMar" : activeTab === "ss_activewear" ? "S&S Activewear" : "catalog"}...
            </p>
          </CardContent>
        </Card>
      );
    }

    if (searchError && searchResults.length === 0) {
      return (
        <Card>
          <CardContent className="py-12 text-center">
            <Search className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">{searchError}</p>
          </CardContent>
        </Card>
      );
    }

    if (searchResults.length === 0) {
      return (
        <Card>
          <CardContent className="py-12 text-center">
            <Search className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">
              {activeTab === "catalog"
                ? "Search products from your local catalog"
                : `Search for products from ${sourceLabel(activeTab)}`}
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <p className="text-sm text-gray-500">{searchResults.length} product{searchResults.length !== 1 ? "s" : ""} found</p>
        </div>
        {searchResults.map((product) => (
          <Card
            key={`${product.source}_${product.id}`}
            className="cursor-pointer hover:border-blue-300 hover:shadow-sm transition-all"
            onClick={() => syncAndOpenConfig(product)}
          >
            <CardContent className="p-4">
              <div className="flex gap-4">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-16 h-16 object-contain rounded border bg-white flex-shrink-0"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : (
                  <div className="w-16 h-16 bg-gray-100 rounded border flex items-center justify-center flex-shrink-0">
                    <Package className="w-6 h-6 text-gray-300" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-medium text-sm truncate">{product.name}</h4>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge className={`text-[10px] ${sourceBadgeColor(product.source)}`}>
                          {sourceLabel(product.source)}
                        </Badge>
                        {product.sku && (
                          <span className="text-xs text-gray-500">SKU: {product.sku}</span>
                        )}
                        {product.supplierName && (
                          <span className="text-xs text-gray-500">{product.supplierName}</span>
                        )}
                        {product.category && (
                          <span className="text-xs text-gray-400">{product.category}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {product.basePrice != null && (
                        <p className="font-semibold text-sm">${product.basePrice.toFixed(2)}</p>
                      )}
                      {product.minQuantity && (
                        <p className="text-[10px] text-gray-400">Min: {product.minQuantity}</p>
                      )}
                    </div>
                  </div>
                  {product.description && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">{product.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2">
                    {product.colors && product.colors.length > 0 && (
                      <span className="text-[10px] text-gray-400">
                        {product.colors.length} color{product.colors.length !== 1 ? "s" : ""}
                      </span>
                    )}
                    {product.sizes && product.sizes.length > 0 && (
                      <span className="text-[10px] text-gray-400">
                        {product.sizes.length} size{product.sizes.length !== 1 ? "s" : ""}
                      </span>
                    )}
                    {product.decorationMethods && product.decorationMethods.length > 0 && (
                      <span className="text-[10px] text-gray-400">
                        {product.decorationMethods.join(", ")}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
}
