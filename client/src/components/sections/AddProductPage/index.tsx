import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { IMPRINT_LOCATIONS, IMPRINT_METHODS } from "@/constants/imprintOptions";
import { marginColorClass, isBelowMinimum, calcMarginPercent } from "@/hooks/useMarginSettings";
import {
  ArrowLeft, Search, Package, PenLine, Loader2, Plus,
  DollarSign, ShoppingCart, Tag, ImageOff, Database
} from "lucide-react";
import type { AddProductPageProps, ProductResult } from "./types";
import { useAddProductPage } from "./hooks";
import EditProductPage from "@/components/sections/EditProductPage";
import { ProductConfigDialog } from "./components/ProductConfigDialog";
import { VendorBlockDialog } from "./components/VendorBlockDialog";
import { MarginWarningDialog } from "./components/MarginWarningDialog";

export default function AddProductPage({ projectId, data }: AddProductPageProps) {
  const h = useAddProductPage({ projectId, data });

  // ── Shared search input renderer ──
  function renderSearchInput(placeholder: string, hint: string) {
    return (
      <Card>
        <CardContent className="pt-5 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                autoFocus
                value={h.searchQuery}
                onChange={(e) => h.setSearchQuery(e.target.value)}
                onKeyDown={h.handleKeyDown}
                placeholder={placeholder}
                className="pl-10"
              />
            </div>
            <Button onClick={h.handleSearch} disabled={h.isSearching || !h.searchQuery.trim()}>
              {h.isSearching ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
              Search
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">{hint} Press Enter to search.</p>
        </CardContent>
      </Card>
    );
  }

  // ── Shared search results renderer ──
  function renderSearchResults() {
    if (h.isSearching) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
          <p className="text-sm text-muted-foreground">
            Searching {h.activeTab === "sage" ? "SAGE" : h.activeTab === "sanmar" ? "SanMar" : h.activeTab === "ss_activewear" ? "S&S Activewear" : "catalog"}...
          </p>
        </div>
      );
    }

    if (h.searchError && h.searchResults.length === 0) {
      return (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Search className="w-10 h-10 text-muted-foreground mb-3 opacity-40" />
            <p className="text-sm text-muted-foreground">{h.searchError}</p>
          </CardContent>
        </Card>
      );
    }

    if (h.searchResults.length === 0) {
      return (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="w-10 h-10 text-muted-foreground mb-3 opacity-40" />
            <p className="text-sm text-muted-foreground">
              {h.activeTab === "catalog"
                ? "Search products from your local catalog"
                : `Search for products from ${h.sourceLabel(h.activeTab)}`}
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Found <strong>{h.searchResults.length}</strong> product{h.searchResults.length !== 1 ? "s" : ""}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {h.searchResults.map((product) => (
            <Card
              key={`${product.source}_${product.id}`}
              className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow group"
              onClick={() => h.syncAndOpenConfig(product)}
            >
              {/* Product Image */}
              <div className="relative h-32 bg-muted flex items-center justify-center overflow-hidden">
                {product.imageUrl && product.source !== 'ss_activewear' ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div className={`flex flex-col items-center justify-center text-muted-foreground ${product.imageUrl && product.source !== 'ss_activewear' ? 'hidden' : ''}`}>
                  {product.source === 'ss_activewear' ? (
                    <>
                      <Package className="w-8 h-8 text-blue-300 mb-1" />
                      <span className="text-xs text-blue-400">S&S Activewear</span>
                    </>
                  ) : (
                    <>
                      <ImageOff size={28} className="mb-1 opacity-40" />
                      <span className="text-xs opacity-60">No image</span>
                    </>
                  )}
                </div>

                {/* Source badge overlay */}
                <Badge className={`absolute top-2 left-2 text-[10px] shadow-sm ${h.sourceBadgeColor(product.source)}`}>
                  {h.sourceLabel(product.source)}
                </Badge>

                {/* Price overlay */}
                {product.basePrice != null && (
                  <Badge className="absolute top-2 right-2 bg-green-600 text-white shadow-sm text-xs">
                    <DollarSign size={10} className="mr-0.5" />
                    {product.basePrice.toFixed(2)}
                  </Badge>
                )}
              </div>

              {/* Product Info */}
              <CardContent className="p-3 space-y-1.5">
                <div>
                  <h4 className="font-semibold text-sm line-clamp-1">{product.name}</h4>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    {product.sku && (
                      <span className="text-xs text-muted-foreground">SKU: {product.sku}</span>
                    )}
                    {product.supplierName && (
                      <span className="text-xs text-muted-foreground">&middot; {product.supplierName}</span>
                    )}
                  </div>
                </div>
                {product.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{product.description}</p>
                )}
                <div className="flex items-center gap-2 pt-1">
                  {product.colors && product.colors.length > 0 && (
                    <Badge variant="secondary" className="text-[10px]">
                      {product.colors.length} color{product.colors.length !== 1 ? "s" : ""}
                    </Badge>
                  )}
                  {product.sizes && product.sizes.length > 0 && (
                    <Badge variant="outline" className="text-[10px]">
                      {product.sizes.length} size{product.sizes.length !== 1 ? "s" : ""}
                    </Badge>
                  )}
                  {product.decorationMethods && product.decorationMethods.length > 0 && (
                    <span className="text-[10px] text-muted-foreground">
                      {product.decorationMethods.slice(0, 2).join(", ")}
                      {product.decorationMethods.length > 2 && ` +${product.decorationMethods.length - 2}`}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // ── Product card renderer for catalog ──
  function renderCatalogGrid() {
    if (h.isCatalogLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Loading catalog...</p>
        </div>
      );
    }

    if (h.filteredCatalogProducts.length === 0) {
      return (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="w-10 h-10 text-muted-foreground mb-3 opacity-40" />
            <p className="text-sm text-muted-foreground">
              {h.allCatalogProducts.length === 0
                ? "No products in catalog yet. Add products from suppliers or use Manual entry."
                : `No products match "${h.catalogFilter}".`}
            </p>
          </CardContent>
        </Card>
      );
    }

    const products = h.filteredCatalogProducts.slice(0, 50);

    return (
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {products.map((p: any) => {
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
                className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow group"
                onClick={() => h.syncAndOpenConfig(product)}
              >
                {/* Product Image */}
                <div className="relative h-64 bg-muted flex items-center justify-center overflow-hidden">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={`flex flex-col items-center justify-center text-muted-foreground ${product.imageUrl ? 'hidden' : ''}`}>
                    <ImageOff size={28} className="mb-1 opacity-40" />
                    <span className="text-xs opacity-60">No image</span>
                  </div>

                  {/* Price overlay */}
                  {product.basePrice != null && (
                    <Badge className="absolute top-2 right-2 bg-green-600 text-white shadow-sm text-xs">
                      <DollarSign size={10} className="mr-0.5" />
                      {product.basePrice.toFixed(2)}
                    </Badge>
                  )}
                </div>

                {/* Product Info */}
                <CardContent className="p-3 space-y-1.5">
                  <div>
                    <h4 className="font-semibold text-sm line-clamp-1">{product.name}</h4>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      {product.sku && (
                        <Badge variant="outline" className="text-[10px]">
                          <Tag className="w-2.5 h-2.5 mr-0.5" />
                          {product.sku}
                        </Badge>
                      )}
                      <Badge variant="secondary" className="text-[10px]">{product.supplierName}</Badge>
                    </div>
                  </div>
                  {product.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{product.description}</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
        {h.filteredCatalogProducts.length > 50 && (
          <p className="text-xs text-muted-foreground text-center py-2">
            Showing first 50 of {h.filteredCatalogProducts.length} results. Refine your filter to see more.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
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

      {/* Syncing overlay — inline toast-style instead of blocking */}
      {h.isSyncing && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg mb-2">
          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
          <p className="text-sm text-blue-700">Syncing product to catalog...</p>
        </div>
      )}

      <Tabs value={h.activeTab} onValueChange={h.handleTabChange}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="catalog" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <Package className="w-3.5 h-3.5 hidden sm:inline" />
            Catalog
          </TabsTrigger>
          <TabsTrigger value="sage" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <Database className="w-3.5 h-3.5 hidden sm:inline" />
            SAGE
          </TabsTrigger>
          <TabsTrigger value="sanmar" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <Package className="w-3.5 h-3.5 hidden sm:inline" />
            SanMar
          </TabsTrigger>
          <TabsTrigger value="ss_activewear" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <ShoppingCart className="w-3.5 h-3.5 hidden sm:inline" />
            S&S
          </TabsTrigger>
          <TabsTrigger value="manual" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <PenLine className="w-3.5 h-3.5 hidden sm:inline" />
            Manual
          </TabsTrigger>
        </TabsList>

        {/* LOCAL CATALOG TAB */}
        <TabsContent value="catalog" forceMount className="data-[state=inactive]:hidden space-y-4">
          <Card>
            <CardContent className="pt-5 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  autoFocus
                  value={h.catalogFilter}
                  onChange={(e) => h.setCatalogFilter(e.target.value)}
                  placeholder="Type to search by name, SKU, or description..."
                  className="pl-10"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Showing {h.filteredCatalogProducts.length} of {h.allCatalogProducts.length} products in your catalog
              </p>
            </CardContent>
          </Card>
          {renderCatalogGrid()}
        </TabsContent>

        {/* SAGE TAB */}
        <TabsContent value="sage" forceMount className="data-[state=inactive]:hidden space-y-4">
          {renderSearchInput(
            "Search keywords, product name, or item number...",
            "SAGE supports full keyword search across all promotional products (pens, bags, mugs, etc.)"
          )}
          {renderSearchResults()}
        </TabsContent>

        {/* SANMAR TAB */}
        <TabsContent value="sanmar" forceMount className="data-[state=inactive]:hidden space-y-4">
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
        <TabsContent value="ss_activewear" forceMount className="data-[state=inactive]:hidden space-y-4">
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
        <TabsContent value="manual" forceMount className="data-[state=inactive]:hidden space-y-4">
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
                  <div className="col-span-2 rounded-lg bg-muted/50 p-4 flex items-center gap-6 text-sm">
                    <div>
                      <span className="text-muted-foreground">Total:</span>{" "}
                      <span className="font-semibold">${(h.manualForm.quantity * h.manualForm.unitPrice).toFixed(2)}</span>
                    </div>
                    {h.manualForm.unitCost > 0 && (() => {
                      const m = ((h.manualForm.unitPrice - h.manualForm.unitCost) / h.manualForm.unitPrice) * 100;
                      return (
                        <div>
                          <span className="text-muted-foreground">Margin:</span>{" "}
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
                        <span className="text-muted-foreground">Profit:</span>{" "}
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
      <ProductConfigDialog
        selectedProduct={h.selectedProduct}
        onClose={() => h.setSelectedProduct(null)}
        configLines={h.configLines}
        configTotalQty={h.configTotalQty}
        configTotalCost={h.configTotalCost}
        configTotalPrice={h.configTotalPrice}
        configMargin={h.configMargin}
        marginSettings={h.marginSettings}
        imprintLocation={h.imprintLocation}
        setImprintLocation={h.setImprintLocation}
        imprintMethod={h.imprintMethod}
        setImprintMethod={h.setImprintMethod}
        productNotes={h.productNotes}
        setProductNotes={h.setProductNotes}
        addConfigLine={h.addConfigLine}
        removeConfigLine={h.removeConfigLine}
        updateConfigLine={h.updateConfigLine}
        handleConfigCostChange={h.handleConfigCostChange}
        handleConfigMarginChange={h.handleConfigMarginChange}
        applyTierToConfigLines={h.applyTierToConfigLines}
        handleAddProduct={h.handleAddProduct}
        addProductMutation={h.addProductMutation}
        sourceBadgeColor={h.sourceBadgeColor}
        sourceLabel={h.sourceLabel}
      />

      {/* VENDOR BLOCK APPROVAL DIALOG */}
      <VendorBlockDialog
        open={h.vendorBlockDialog.open}
        supplierName={h.vendorBlockDialog.supplierName}
        approvalReason={h.approvalReason}
        setApprovalReason={h.setApprovalReason}
        onDismiss={h.dismissVendorBlock}
        vendorApprovalMutation={h.vendorApprovalMutation}
      />

      {/* POST-CREATE EDIT DIALOG */}
      {h.postCreateItemId && (
        <EditProductPage
          open
          onClose={() => {
            h.setPostCreateItemId(null);
            h.setLocation(h.productsPath);
          }}
          projectId={projectId}
          itemId={h.postCreateItemId}
          data={data}
        />
      )}

      {/* MARGIN WARNING DIALOG */}
      <MarginWarningDialog
        open={!!h.marginWarningAction}
        marginWarningValue={h.marginWarningValue}
        minimumMargin={h.marginSettings.minimumMargin}
        onDismiss={h.dismissMarginWarning}
        onConfirm={h.confirmMarginWarning}
      />
    </div>
  );
}
