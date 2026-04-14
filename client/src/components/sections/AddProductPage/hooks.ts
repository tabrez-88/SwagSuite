import { useState, useCallback, useMemo } from "react";
import { useLocation } from "@/lib/wouter-compat";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useMarginSettings, isBelowMinimum, calcMarginPercent, applyMargin } from "@/hooks/useMarginSettings";
import { projectKeys } from "@/services/projects/keys";
import type { AddProductPageProps, ProductResult, ConfigLine, SourceTab } from "./types";

// S&S CDN is behind Cloudflare — images can't be loaded directly or via proxy
// Store the raw URL for later Cloudinary caching on sync; display uses placeholder
function getSsImageUrl(product: any): string | undefined {
  const img = product.colorFrontImage || product.colorSideImage || product.colorSwatchImage || product.imageUrl;
  if (!img) return undefined;
  return img.startsWith('http') ? img : `https://www.ssactivewear.com/${img}`;
}

export function useAddProductPage({ projectId, data }: AddProductPageProps) {
  const marginSettings = useMarginSettings();
  const [currentLocation, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Detect which section we came from
  const isPresentationContext = currentLocation.includes("/presentation/add");
  const isQuoteContext = currentLocation.includes("/quote/add");
  const productsPath = isPresentationContext
    ? `/projects/${projectId}/presentation`
    : isQuoteContext
      ? `/projects/${projectId}/quote`
      : `/projects/${projectId}/sales-order`;

  // Search state — per-tab so switching tabs doesn't leak loading/results
  const [activeTab, setActiveTab] = useState<SourceTab>("catalog");
  const [isSyncing, setIsSyncing] = useState(false);

  type TabSearchState = { query: string; results: ProductResult[]; isSearching: boolean; error: string | null };
  const emptySearch: TabSearchState = { query: "", results: [], isSearching: false, error: null };
  const [tabSearch, setTabSearch] = useState<Record<string, TabSearchState>>({
    sage: { ...emptySearch },
    sanmar: { ...emptySearch },
    ss_activewear: { ...emptySearch },
  });

  // Current tab's search state (convenience accessors)
  const currentSearch = tabSearch[activeTab] || emptySearch;
  const searchQuery = currentSearch.query;
  const searchResults = currentSearch.results;
  const isSearching = currentSearch.isSearching;
  const searchError = currentSearch.error;

  const setSearchQuery = useCallback((q: string) => {
    setTabSearch(prev => ({ ...prev, [activeTab]: { ...prev[activeTab] || emptySearch, query: q } }));
  }, [activeTab]);

  // Helper to update a specific tab's search state
  const updateTabSearch = useCallback((tab: string, updates: Partial<TabSearchState>) => {
    setTabSearch(prev => ({ ...prev, [tab]: { ...prev[tab] || emptySearch, ...updates } }));
  }, []);

  // Configuration dialog
  const [selectedProduct, setSelectedProduct] = useState<ProductResult | null>(null);
  const [configLines, setConfigLines] = useState<ConfigLine[]>([]);
  const [productNotes, setProductNotes] = useState("");
  const [imprintLocation, setImprintLocation] = useState("");
  const [imprintMethod, setImprintMethod] = useState("");

  // Margin warning state
  const [marginWarningAction, setMarginWarningAction] = useState<(() => void) | null>(null);
  const [marginWarningValue, setMarginWarningValue] = useState<number>(0);

  // Post-create Edit dialog state — after item is created, open Edit dialog
  // so user can add charges/artwork without leaving the page.
  const [postCreateItemId, setPostCreateItemId] = useState<string | null>(null);

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
  // Each function targets its own tab's state, so switching tabs doesn't affect other searches
  const searchSage = useCallback(async () => {
    const q = (tabSearch.sage?.query || "").trim();
    if (!q) return;
    updateTabSearch("sage", { isSearching: true, error: null, results: [] });
    try {
      const res = await fetch("/api/integrations/sage/products?" + new URLSearchParams({ search: q }));
      if (!res.ok) throw new Error("SAGE search failed");
      const data = await res.json();
      const results: ProductResult[] = (data.products || []).map((p: any) => {
        let basePrice: number | undefined;
        let pricingTiers: { quantity: number; cost: number }[] | undefined;
        if (p.pricingStructure) {
          if (typeof p.pricingStructure.minPrice === 'number') {
            basePrice = p.pricingStructure.minPrice;
          } else {
            const numericValues = Object.values(p.pricingStructure).filter((v): v is number => typeof v === 'number');
            if (numericValues.length > 0) basePrice = Math.min(...numericValues);
          }
          // Extract quantity break tiers from SAGE pricing structure
          const qtys = p.pricingStructure.quantities as number[] | undefined;
          const costs = (p.pricingStructure.netPrices || p.pricingStructure.prices) as string[] | undefined;
          if (qtys?.length && costs?.length) {
            pricingTiers = qtys
              .map((q: number, i: number) => ({ quantity: q, cost: parseFloat(costs![i]) || 0 }))
              .filter(t => t.quantity > 0 && t.cost > 0);
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
          pricingTiers,
          colors: Array.isArray(p.colors) ? p.colors : [],
          sizes: Array.isArray(p.sizes) ? p.sizes : [],
          minQuantity: p.quantityBreaks?.[0],
          decorationMethods: p.decorationMethods || [],
          rawData: p,
        };
      });
      updateTabSearch("sage", { results, error: results.length === 0 ? "No SAGE products found for this keyword." : null });
    } catch {
      updateTabSearch("sage", { error: "Failed to search SAGE. Check your credentials in Settings." });
    } finally {
      updateTabSearch("sage", { isSearching: false });
    }
  }, [tabSearch.sage?.query, updateTabSearch]);

  const searchSanMar = useCallback(async () => {
    const q = (tabSearch.sanmar?.query || "").trim();
    if (!q) return;
    updateTabSearch("sanmar", { isSearching: true, error: null, results: [] });
    try {
      const res = await fetch("/api/sanmar/search?" + new URLSearchParams({ q }));
      if (!res.ok) throw new Error("SanMar search failed");
      const products = await res.json();
      const results: ProductResult[] = (Array.isArray(products) ? products : []).map((p: any) => {
        const tiers: { quantity: number; cost: number }[] = [];
        if (p.piecePrice) tiers.push({ quantity: 1, cost: parseFloat(p.piecePrice) || 0 });
        if (p.dozenPrice) tiers.push({ quantity: 12, cost: parseFloat(p.dozenPrice) || 0 });
        if (p.casePrice && p.caseSize) tiers.push({ quantity: parseInt(p.caseSize) || 72, cost: parseFloat(p.casePrice) || 0 });
        return {
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
          pricingTiers: tiers.length > 0 ? tiers.filter(t => t.cost > 0) : undefined,
          colors: p.colors || [],
          sizes: p.sizes || [],
          minQuantity: p.caseSize || 1,
          decorationMethods: [],
          rawData: p,
        };
      });
      updateTabSearch("sanmar", { results, error: results.length === 0 ? "No SanMar products found. Try a style number (PC54, G500) or brand name (Nike, OGIO)." : null });
    } catch {
      updateTabSearch("sanmar", { error: "Failed to search SanMar. Check your credentials in Settings." });
    } finally {
      updateTabSearch("sanmar", { isSearching: false });
    }
  }, [tabSearch.sanmar?.query, updateTabSearch]);

  const searchSsActivewear = useCallback(async () => {
    const q = (tabSearch.ss_activewear?.query || "").trim();
    if (!q) return;
    updateTabSearch("ss_activewear", { isSearching: true, error: null, results: [] });
    try {
      const res = await fetch("/api/ss-activewear/search?" + new URLSearchParams({ q }));
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
        const ssTiers: { quantity: number; cost: number }[] = [];
        if (p.customerPrice || p.piecePrice) ssTiers.push({ quantity: 1, cost: parseFloat(p.customerPrice || p.piecePrice) || 0 });
        if (p.dozenPrice) ssTiers.push({ quantity: 12, cost: parseFloat(p.dozenPrice) || 0 });
        if (p.casePrice && p.caseQty) ssTiers.push({ quantity: parseInt(p.caseQty) || 72, cost: parseFloat(p.casePrice) || 0 });
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
          pricingTiers: ssTiers.length > 0 ? ssTiers.filter(t => t.cost > 0) : undefined,
          colors: Array.from(colors),
          sizes: Array.from(sizes),
          minQuantity: 1,
          decorationMethods: [],
          rawData: p,
        });
      }
      updateTabSearch("ss_activewear", { results, error: results.length === 0 ? "No S&S Activewear products found for this search term." : null });
    } catch {
      updateTabSearch("ss_activewear", { error: "Failed to search S&S Activewear. Check your credentials in Settings." });
    } finally {
      updateTabSearch("ss_activewear", { isSearching: false });
    }
  }, [tabSearch.ss_activewear?.query, updateTabSearch]);

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
      // For SAGE products without tiers, fetch pricing detail from 105 API in parallel
      const sageProdEId = product.source === "sage" && !product.pricingTiers?.length
        ? (product.rawData?.prodEId || "")
        : "";

      const [syncRes, sagePricingRes] = await Promise.all([
        fetch("/api/products/sync-from-supplier", {
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
            pricingTiers: product.pricingTiers,
          }),
        }),
        sageProdEId
          ? fetch(`/api/sage/product-pricing/${sageProdEId}`).then(r => r.ok ? r.json() : null).catch(() => null)
          : Promise.resolve(null),
      ]);

      if (!syncRes.ok) throw new Error("Sync failed");
      const { product: catalogProduct, supplier, isNew } = await syncRes.json();

      if (isNew) {
        toast({ title: `Product "${product.name}" added to catalog`, description: `Vendor: ${supplier.name}` });
      }

      // Merge SAGE pricing tiers if fetched
      let mergedTiers = product.pricingTiers;
      if (sagePricingRes?.pricingTiers?.length) {
        mergedTiers = sagePricingRes.pricingTiers;
        // Also persist tiers to product catalog
        fetch(`/api/products/${catalogProduct.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ pricingTiers: mergedTiers }),
        }).catch(() => { /* best-effort */ });
      }

      // Invalidate product + supplier queries so catalog & vendor info is up to date
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });

      // Open config with synced product data (keeps supplier colors/sizes from API)
      openProductConfig({
        ...product,
        id: catalogProduct.id,
        supplierName: supplier.name,
        pricingTiers: mergedTiers,
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

  // Apply supplier tier cost/price to all config lines
  const applyTierToConfigLines = (cost: number, price: number) => {
    setConfigLines(prev => prev.map(line => ({ ...line, unitCost: cost, unitPrice: price })));
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
      const itemRes = await fetch(`/api/projects/${projectId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
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
            fetch(`/api/project-items/${createdItem.id}/lines`, {
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
    onSuccess: (createdItem: any) => {
      toast({ title: "Product added — configure charges & artwork" });
      queryClient.invalidateQueries({ queryKey: projectKeys.items(projectId) });
      queryClient.invalidateQueries({ queryKey: projectKeys.itemsWithDetails(projectId) });
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      queryClient.invalidateQueries({ queryKey: projectKeys.itemLines(projectId) });
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setSelectedProduct(null);
      setPostCreateItemId(createdItem.id);
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
          orderId: projectId,
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

      const res = await fetch(`/api/projects/${projectId}/items`, {
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
        await fetch(`/api/project-items/${createdItem.id}/lines`, {
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
    onSuccess: (createdItem: any) => {
      toast({ title: "Product added — configure charges & artwork" });
      queryClient.invalidateQueries({ queryKey: projectKeys.items(projectId) });
      queryClient.invalidateQueries({ queryKey: projectKeys.itemsWithDetails(projectId) });
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      queryClient.invalidateQueries({ queryKey: projectKeys.itemLines(projectId) });
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setPostCreateItemId(createdItem.id);
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

  // Brand search helpers — write to the specific tab's state
  const searchSanMarBrand = (brand: string) => {
    updateTabSearch("sanmar", { query: brand, isSearching: true, error: null, results: [] });
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
        updateTabSearch("sanmar", { results, error: results.length === 0 ? `No SanMar products found for "${brand}".` : null });
      })
      .catch(() => updateTabSearch("sanmar", { error: "Failed to search SanMar." }))
      .finally(() => updateTabSearch("sanmar", { isSearching: false }));
  };

  const searchSsBrand = (brandName: string) => {
    updateTabSearch("ss_activewear", { query: brandName, isSearching: true, error: null, results: [] });
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
        updateTabSearch("ss_activewear", { results, error: results.length === 0 ? `No S&S products found for "${brandName}".` : null });
      })
      .catch(() => updateTabSearch("ss_activewear", { error: "Failed to search S&S Activewear." }))
      .finally(() => updateTabSearch("ss_activewear", { isSearching: false }));
  };

  // Tab change no longer clears search state — each tab preserves its own results
  const handleTabChange = (v: string) => {
    setActiveTab(v as SourceTab);
  };

  const handleAddProduct = () => {
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
  };

  const handleAddManualProduct = () => {
    if (manualForm.unitCost > 0) {
      const m = ((manualForm.unitPrice - manualForm.unitCost) / manualForm.unitPrice) * 100;
      if (isBelowMinimum(m, marginSettings)) {
        setMarginWarningValue(m);
        setMarginWarningAction(() => () => addManualProductMutation.mutate());
        return;
      }
    }
    addManualProductMutation.mutate();
  };

  const handleManualCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newCost = parseFloat(e.target.value) || 0;
    setManualForm(f => {
      if (newCost > 0 && f.unitPrice > 0) {
        const currentMargin = calcMarginPercent(f.unitCost, f.unitPrice);
        if (currentMargin > 0 && currentMargin < 100) {
          const { price } = applyMargin(newCost, 0, currentMargin);
          return { ...f, unitCost: newCost, unitPrice: price };
        }
      }
      return { ...f, unitCost: newCost };
    });
  };

  const handleManualMarginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetMargin = parseFloat(e.target.value) || 0;
    const result = applyMargin(manualForm.unitCost, manualForm.unitPrice, targetMargin);
    setManualForm(f => ({ ...f, unitCost: result.cost, unitPrice: result.price }));
  };

  const handleConfigCostChange = (lineId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const newCost = parseFloat(e.target.value) || 0;
    const line = configLines.find(l => l.id === lineId);
    if (line && newCost > 0 && line.unitPrice > 0) {
      const currentMargin = calcMarginPercent(line.unitCost, line.unitPrice);
      if (currentMargin > 0 && currentMargin < 100) {
        const { price } = applyMargin(newCost, 0, currentMargin);
        updateConfigLineMulti(lineId, { unitCost: newCost, unitPrice: price });
        return;
      }
    }
    updateConfigLine(lineId, "unitCost", newCost);
  };

  const handleConfigMarginChange = (lineId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const line = configLines.find(l => l.id === lineId);
    if (!line) return;
    const targetMargin = parseFloat(e.target.value) || 0;
    const result = applyMargin(line.unitCost, line.unitPrice, targetMargin);
    updateConfigLineMulti(lineId, { unitCost: result.cost, unitPrice: result.price });
  };

  const dismissMarginWarning = () => {
    setMarginWarningAction(null);
    setMarginWarningValue(0);
  };

  const confirmMarginWarning = () => {
    if (marginWarningAction) marginWarningAction();
    setMarginWarningAction(null);
    setMarginWarningValue(0);
  };

  const dismissVendorBlock = () => {
    setVendorBlockDialog({ open: false, supplierId: "", supplierName: "", reason: "" });
    setApprovalReason("");
  };

  return {
    // Settings
    marginSettings,
    // Navigation
    productsPath,
    setLocation,
    // Search
    searchQuery,
    setSearchQuery,
    activeTab,
    searchResults,
    isSearching,
    searchError,
    isSyncing,
    handleSearch,
    handleKeyDown,
    handleTabChange,
    syncAndOpenConfig,
    // Catalog
    catalogFilter,
    setCatalogFilter,
    allCatalogProducts,
    filteredCatalogProducts,
    isCatalogLoading,
    // Brands
    SANMAR_BRANDS,
    ssBrands,
    searchSanMarBrand,
    searchSsBrand,
    // Config dialog
    selectedProduct,
    setSelectedProduct,
    configLines,
    productNotes,
    setProductNotes,
    imprintLocation,
    setImprintLocation,
    imprintMethod,
    setImprintMethod,
    addConfigLine,
    updateConfigLine,
    removeConfigLine,
    applyTierToConfigLines,
    configTotalQty,
    configTotalCost,
    configTotalPrice,
    configMargin,
    handleAddProduct,
    addProductMutation,
    handleConfigCostChange,
    handleConfigMarginChange,
    // Manual entry
    manualForm,
    setManualForm,
    addManualProductMutation,
    handleAddManualProduct,
    handleManualCostChange,
    handleManualMarginChange,
    // Margin warning
    marginWarningAction,
    marginWarningValue,
    dismissMarginWarning,
    confirmMarginWarning,
    // Post-create edit dialog
    postCreateItemId,
    setPostCreateItemId,
    // Vendor block
    vendorBlockDialog,
    dismissVendorBlock,
    approvalReason,
    setApprovalReason,
    vendorApprovalMutation,
    // Helpers
    sourceLabel,
    sourceBadgeColor,
    data,
  };
}
