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
import {
  ArrowLeft, Search, Package, PenLine, Loader2, Plus,
  DollarSign, ShoppingCart, Trash2, ImageIcon, Tag, ShieldAlert
} from "lucide-react";
import { IMPRINT_LOCATIONS, IMPRINT_METHODS } from "@/constants/imprintOptions";
import { marginColorClass, isBelowMinimum, calcMarginPercent } from "@/hooks/useMarginSettings";
import type { AddProductPageProps, ProductResult } from "./types";
import { useAddProductPage } from "./hooks";

export default function AddProductPage({ orderId, data }: AddProductPageProps) {
  const h = useAddProductPage({ orderId, data });

  // ── Shared search input renderer ──
  function renderSearchInput(placeholder: string, hint: string) {
    return (
      <Card>
        <CardContent className="pt-5 space-y-3">
          <div className="flex gap-2">
            <Input
              value={h.searchQuery}
              onChange={(e) => h.setSearchQuery(e.target.value)}
              onKeyDown={h.handleKeyDown}
              placeholder={placeholder}
              className="flex-1"
            />
            <Button onClick={h.handleSearch} disabled={h.isSearching || !h.searchQuery.trim()}>
              {h.isSearching ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
              Search
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">{hint}</p>
        </CardContent>
      </Card>
    );
  }

  // ── Shared search results renderer ──
  function renderSearchResults() {
    if (h.isSearching) {
      return (
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="w-10 h-10 mx-auto mb-3 animate-spin text-blue-500" />
            <p className="text-gray-500">
              Searching {h.activeTab === "sage" ? "SAGE" : h.activeTab === "sanmar" ? "SanMar" : h.activeTab === "ss_activewear" ? "S&S Activewear" : "catalog"}...
            </p>
          </CardContent>
        </Card>
      );
    }

    if (h.searchError && h.searchResults.length === 0) {
      return (
        <Card>
          <CardContent className="py-12 text-center">
            <Search className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">{h.searchError}</p>
          </CardContent>
        </Card>
      );
    }

    if (h.searchResults.length === 0) {
      return (
        <Card>
          <CardContent className="py-12 text-center">
            <Search className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">
              {h.activeTab === "catalog"
                ? "Search products from your local catalog"
                : `Search for products from ${h.sourceLabel(h.activeTab)}`}
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <p className="text-sm text-gray-500">{h.searchResults.length} product{h.searchResults.length !== 1 ? "s" : ""} found</p>
        </div>
        {h.searchResults.map((product) => (
          <Card
            key={`${product.source}_${product.id}`}
            className="cursor-pointer hover:border-blue-300 hover:shadow-sm transition-all"
            onClick={() => h.syncAndOpenConfig(product)}
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
                        <Badge className={`text-[10px] ${h.sourceBadgeColor(product.source)}`}>
                          {h.sourceLabel(product.source)}
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

  // ── Product card renderer for catalog ──
  function renderProductCard(p: any) {
    const product: ProductResult = {
      id: p.id,
      source: "local",
      name: p.name || p.productName,
      sku: p.sku,
      description: p.description,
      supplierName: h.data.suppliers?.find((s: any) => s.id === p.supplierId)?.name || "Unknown",
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
        onClick={() => h.syncAndOpenConfig(product)}
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
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => h.setLocation(h.productsPath)}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Products
        </Button>
        <h2 className="text-xl font-semibold">Add Product to Order</h2>
      </div>

      {/* Syncing overlay */}
      {h.isSyncing && (
        <Card>
          <CardContent className="py-6 text-center">
            <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin text-blue-500" />
            <p className="text-sm text-gray-500">Syncing product to catalog...</p>
          </CardContent>
        </Card>
      )}

      <Tabs value={h.activeTab} onValueChange={h.handleTabChange}>
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

        {/* LOCAL CATALOG TAB */}
        <TabsContent value="catalog" className="space-y-4">
          <Card>
            <CardContent className="pt-5 space-y-3">
              <Input
                value={h.catalogFilter}
                onChange={(e) => h.setCatalogFilter(e.target.value)}
                placeholder="Filter by name, SKU, or description..."
                className="flex-1"
              />
              <p className="text-xs text-muted-foreground">
                Showing {h.filteredCatalogProducts.length} of {h.allCatalogProducts.length} products in your catalog. Type to filter instantly.
              </p>
            </CardContent>
          </Card>
          {h.isCatalogLoading ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Loader2 className="w-6 h-6 mx-auto mb-2 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Loading catalog...</p>
              </CardContent>
            </Card>
          ) : h.filteredCatalogProducts.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Package className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {h.allCatalogProducts.length === 0
                    ? "No products in catalog yet. Add products from suppliers or use Manual entry."
                    : `No products match "${h.catalogFilter}".`}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {h.filteredCatalogProducts.slice(0, 50).map((p: any) => renderProductCard(p))}
              {h.filteredCatalogProducts.length > 50 && (
                <p className="text-xs text-muted-foreground col-span-full text-center py-2">
                  Showing first 50 of {h.filteredCatalogProducts.length} results. Refine your filter to see more.
                </p>
              )}
            </div>
          )}
        </TabsContent>

        {/* SAGE TAB */}
        <TabsContent value="sage" className="space-y-4">
          {renderSearchInput(
            "Search keywords, product name, or item number...",
            "SAGE supports full keyword search across all promotional products (pens, bags, mugs, etc.)"
          )}
          {renderSearchResults()}
        </TabsContent>

        {/* SANMAR TAB */}
        <TabsContent value="sanmar" className="space-y-4">
          {renderSearchInput(
            "Style number (PC54, G500, DT6000) or brand name...",
            "SanMar works best with style numbers or exact brand names. Click a brand below to search."
          )}
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs font-medium text-muted-foreground mb-2">Quick Brand Search</p>
              <div className="flex flex-wrap gap-1.5">
                {h.SANMAR_BRANDS.map((brand) => (
                  <Badge
                    key={brand}
                    variant="outline"
                    className="cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-colors text-xs px-2.5 py-1"
                    onClick={() => h.searchSanMarBrand(brand)}
                  >
                    {brand}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
          {renderSearchResults()}
        </TabsContent>

        {/* S&S ACTIVEWEAR TAB */}
        <TabsContent value="ss_activewear" className="space-y-4">
          {renderSearchInput(
            "Keyword (polo, hoodie), style number, or brand name...",
            "S&S Activewear supports keyword search, style numbers, and brand names. Click a brand below to search."
          )}
          {h.ssBrands.length > 0 && (
            <Card>
              <CardContent className="pt-4 pb-3">
                <p className="text-xs font-medium text-muted-foreground mb-2">Quick Brand Search ({h.ssBrands.length} brands)</p>
                <ScrollArea className="max-h-32">
                  <div className="flex flex-wrap gap-1.5">
                    {h.ssBrands.map((brand: any) => (
                      <Badge
                        key={brand.brandId || brand.id || brand.brandName}
                        variant="outline"
                        className="cursor-pointer hover:bg-purple-50 hover:border-purple-300 transition-colors text-xs px-2.5 py-1"
                        onClick={() => h.searchSsBrand(brand.brandName || brand.name)}
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

        {/* MANUAL ENTRY TAB */}
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
                    value={h.manualForm.productName}
                    onChange={(e) => h.setManualForm(f => ({ ...f, productName: e.target.value }))}
                    placeholder="e.g., Custom Printed T-Shirt"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <Label>SKU / Style Number</Label>
                  <Input
                    value={h.manualForm.productSku}
                    onChange={(e) => h.setManualForm(f => ({ ...f, productSku: e.target.value }))}
                    placeholder="e.g., TSH-001"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <Label>Supplier / Vendor Name</Label>
                  <Input
                    value={h.manualForm.supplierName}
                    onChange={(e) => h.setManualForm(f => ({ ...f, supplierName: e.target.value }))}
                    placeholder="e.g., Alpha Broder"
                  />
                </div>
                <div>
                  <Label>Quantity *</Label>
                  <Input
                    type="number"
                    min={1}
                    value={h.manualForm.quantity}
                    onChange={(e) => h.setManualForm(f => ({ ...f, quantity: parseInt(e.target.value) || 1 }))}
                  />
                </div>
                <div>
                  <Label>Unit Cost (your cost)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    value={h.manualForm.unitCost}
                    onChange={h.handleManualCostChange}
                  />
                </div>
                <div>
                  <Label>Unit Price (sell price) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    value={h.manualForm.unitPrice}
                    onChange={(e) => h.setManualForm(f => ({ ...f, unitPrice: parseFloat(e.target.value) || 0 }))}
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
                      className={`pr-7 ${isBelowMinimum(calcMarginPercent(h.manualForm.unitCost, h.manualForm.unitPrice), h.marginSettings) ? "border-red-300 text-red-600" : ""}`}
                      value={parseFloat(calcMarginPercent(h.manualForm.unitCost, h.manualForm.unitPrice).toFixed(1))}
                      onChange={h.handleManualMarginChange}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
                  </div>
                  {h.manualForm.unitCost === 0 && h.manualForm.unitPrice === 0 && (
                    <p className="text-[10px] text-gray-400 mt-1">Enter cost or price first to use margin</p>
                  )}
                </div>
                <div>
                  <Label>Color</Label>
                  <Input
                    value={h.manualForm.color}
                    onChange={(e) => h.setManualForm(f => ({ ...f, color: e.target.value }))}
                    placeholder="e.g., Navy Blue"
                  />
                </div>
                <div>
                  <Label>Size</Label>
                  <Input
                    value={h.manualForm.size}
                    onChange={(e) => h.setManualForm(f => ({ ...f, size: e.target.value }))}
                    placeholder="e.g., L, XL"
                  />
                </div>
                <div>
                  <Label>Imprint Location</Label>
                  <Select value={h.manualForm.imprintLocation} onValueChange={(v) => h.setManualForm(f => ({ ...f, imprintLocation: v }))}>
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
                  <Select value={h.manualForm.imprintMethod} onValueChange={(v) => h.setManualForm(f => ({ ...f, imprintMethod: v }))}>
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
                    value={h.manualForm.notes}
                    onChange={(e) => h.setManualForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="Additional product notes..."
                    rows={3}
                  />
                </div>

                {/* Manual Summary */}
                {h.manualForm.unitPrice > 0 && (
                  <div className="col-span-2 rounded-lg bg-gray-50 p-4 flex items-center gap-6 text-sm">
                    <div>
                      <span className="text-gray-500">Total:</span>{" "}
                      <span className="font-semibold">${(h.manualForm.quantity * h.manualForm.unitPrice).toFixed(2)}</span>
                    </div>
                    {h.manualForm.unitCost > 0 && (() => {
                      const m = ((h.manualForm.unitPrice - h.manualForm.unitCost) / h.manualForm.unitPrice) * 100;
                      return (
                        <div>
                          <span className="text-gray-500">Margin:</span>{" "}
                          <span className={`font-semibold ${marginColorClass(m, h.marginSettings)}`}>
                            {m.toFixed(1)}%
                          </span>
                          {isBelowMinimum(m, h.marginSettings) && (
                            <span className="ml-2 text-red-500 text-xs">Below min ({h.marginSettings.minimumMargin}%)</span>
                          )}
                        </div>
                      );
                    })()}
                    {h.manualForm.unitCost > 0 && (
                      <div>
                        <span className="text-gray-500">Profit:</span>{" "}
                        <span className="font-semibold text-green-700">
                          ${((h.manualForm.unitPrice - h.manualForm.unitCost) * h.manualForm.quantity).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <div className="col-span-2 flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => h.setLocation(h.productsPath)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={h.handleAddManualProduct}
                    disabled={!h.manualForm.productName || h.manualForm.unitPrice <= 0 || h.addManualProductMutation.isPending}
                  >
                    {h.addManualProductMutation.isPending ? (
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

      {/* PRODUCT CONFIGURATION DIALOG */}
      <Dialog open={!!h.selectedProduct} onOpenChange={(open) => !open && h.setSelectedProduct(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Configure Product
            </DialogTitle>
          </DialogHeader>

          {h.selectedProduct && (
            <div className="space-y-6">
              {/* Product Summary */}
              <div className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                {h.selectedProduct.imageUrl ? (
                  <img
                    src={h.selectedProduct.imageUrl}
                    alt={h.selectedProduct.name}
                    className="w-20 h-20 object-contain rounded border bg-white"
                  />
                ) : (
                  <div className="w-20 h-20 bg-gray-200 rounded border flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{h.selectedProduct.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {h.selectedProduct.sku && (
                      <Badge variant="outline" className="text-xs">
                        <Tag className="w-3 h-3 mr-1" />
                        {h.selectedProduct.sku}
                      </Badge>
                    )}
                    <Badge className={`text-xs ${h.sourceBadgeColor(h.selectedProduct.source)}`}>
                      {h.sourceLabel(h.selectedProduct.source)}
                    </Badge>
                    {h.selectedProduct.supplierName && (
                      <span className="text-sm text-gray-500">{h.selectedProduct.supplierName}</span>
                    )}
                  </div>
                  {h.selectedProduct.description && (
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">{h.selectedProduct.description}</p>
                  )}
                </div>
              </div>

              {/* Imprint Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Imprint Location</Label>
                  <Select value={h.imprintLocation} onValueChange={h.setImprintLocation}>
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
                  {h.selectedProduct.decorationMethods && h.selectedProduct.decorationMethods.length > 0 ? (
                    <Select value={h.imprintMethod} onValueChange={h.setImprintMethod}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                      <SelectContent>
                        {h.selectedProduct.decorationMethods.map((m: string) => (
                          <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Select value={h.imprintMethod} onValueChange={h.setImprintMethod}>
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
                  <Button variant="outline" size="sm" onClick={h.addConfigLine}>
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
                      {h.configLines.map((line) => {
                        const lineTotal = line.quantity * line.unitPrice;
                        const lineMargin = calcMarginPercent(line.unitCost, line.unitPrice);
                        return (
                          <tr key={line.id} className={`border-b last:border-0 ${isBelowMinimum(lineMargin, h.marginSettings) ? "bg-red-50/30" : ""}`}>
                            <td className="p-2">
                              <>
                                <Input
                                  className="h-8 text-xs"
                                  value={line.color}
                                  onChange={(e) => h.updateConfigLine(line.id, "color", e.target.value)}
                                  placeholder="Color"
                                  list={`colors-${line.id}`}
                                />
                                {h.selectedProduct!.colors && h.selectedProduct!.colors.length > 0 && (
                                  <datalist id={`colors-${line.id}`}>
                                    {h.selectedProduct!.colors.map(c => (
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
                                  onChange={(e) => h.updateConfigLine(line.id, "size", e.target.value)}
                                  placeholder="Size"
                                  list={`sizes-${line.id}`}
                                />
                                {h.selectedProduct!.sizes && h.selectedProduct!.sizes.length > 0 && (
                                  <datalist id={`sizes-${line.id}`}>
                                    {h.selectedProduct!.sizes.map(s => (
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
                                onChange={(e) => h.updateConfigLine(line.id, "quantity", parseInt(e.target.value) || 0)}
                              />
                            </td>
                            <td className="p-2">
                              <Input
                                className="h-8 text-xs text-right"
                                type="number"
                                step="0.01"
                                min={0}
                                value={line.unitCost}
                                onChange={(e) => h.handleConfigCostChange(line.id, e)}
                              />
                            </td>
                            <td className="p-2">
                              <Input
                                className="h-8 text-xs text-right"
                                type="number"
                                step="0.01"
                                min={0}
                                value={line.unitPrice}
                                onChange={(e) => h.updateConfigLine(line.id, "unitPrice", parseFloat(e.target.value) || 0)}
                              />
                            </td>
                            <td className="p-2">
                              <div className="relative">
                                <Input
                                  className={`h-8 text-xs text-right pr-5 ${isBelowMinimum(lineMargin, h.marginSettings) ? "border-red-300 text-red-600" : ""}`}
                                  type="number"
                                  step="0.1"
                                  min={0}
                                  max={99.9}
                                  value={parseFloat(lineMargin.toFixed(1))}
                                  onChange={(e) => h.handleConfigMarginChange(line.id, e)}
                                />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">%</span>
                              </div>
                            </td>
                            <td className="p-2 text-right">
                              <span className={`text-xs font-medium ${marginColorClass(lineMargin, h.marginSettings)}`}>${lineTotal.toFixed(2)}</span>
                            </td>
                            <td className="p-2">
                              {h.configLines.length > 1 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0"
                                  onClick={() => h.removeConfigLine(line.id)}
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
                        <td className="p-3 text-right text-sm font-semibold">{h.configTotalQty}</td>
                        <td className="p-3 text-right text-sm text-gray-500">${h.configTotalCost.toFixed(2)}</td>
                        <td className="p-3"></td>
                        <td className="p-3 text-right">
                          <span className={`text-sm font-semibold ${marginColorClass(h.configMargin, h.marginSettings)}`}>
                            {h.configMargin.toFixed(1)}%
                          </span>
                        </td>
                        <td className="p-3 text-right text-sm font-semibold">${h.configTotalPrice.toFixed(2)}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Minimum Margin Warning */}
              {isBelowMinimum(h.configMargin, h.marginSettings) && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 flex items-center gap-2 text-sm text-red-700">
                  <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                  <span>
                    Margin ({h.configMargin.toFixed(1)}%) is below the company minimum of {h.marginSettings.minimumMargin}%.
                    Adding this product will require confirmation.
                  </span>
                </div>
              )}

              {/* Notes */}
              <div>
                <Label>Product Notes</Label>
                <Textarea
                  value={h.productNotes}
                  onChange={(e) => h.setProductNotes(e.target.value)}
                  placeholder="Special instructions, decoration details, etc."
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => h.setSelectedProduct(null)}>
              Cancel
            </Button>
            <Button
              onClick={h.handleAddProduct}
              disabled={h.addProductMutation.isPending || h.configLines.length === 0 || h.configTotalQty === 0}
            >
              {h.addProductMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <DollarSign className="w-4 h-4 mr-2" />
              )}
              Add to Order — ${h.configTotalPrice.toFixed(2)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Vendor "Do Not Order" Approval Request Dialog */}
      <AlertDialog
        open={h.vendorBlockDialog.open}
        onOpenChange={(open) => {
          if (!open) h.dismissVendorBlock();
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
                  <span className="font-semibold">{h.vendorBlockDialog.supplierName}</span> is currently marked as "Do Not Order."
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
                    value={h.approvalReason}
                    onChange={(e) => h.setApprovalReason(e.target.value)}
                    className="mt-1"
                    rows={3}
                  />
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={h.vendorApprovalMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                h.vendorApprovalMutation.mutate();
              }}
              disabled={h.vendorApprovalMutation.isPending}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {h.vendorApprovalMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Request Approval
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* MARGIN WARNING CONFIRMATION DIALOG */}
      <AlertDialog open={!!h.marginWarningAction} onOpenChange={(open) => { if (!open) h.dismissMarginWarning(); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <ShieldAlert className="w-5 h-5" />
              Below Minimum Margin
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <p>
                  The margin for this product is <strong className="text-red-600">{h.marginWarningValue.toFixed(1)}%</strong>, which is below
                  the company minimum of <strong>{h.marginSettings.minimumMargin}%</strong>.
                </p>
                <p className="mt-2 text-orange-600 font-medium">
                  Are you sure you want to add this product with a below-minimum margin?
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={h.dismissMarginWarning}>
              Go Back & Adjust
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={h.confirmMarginWarning}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Add Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
