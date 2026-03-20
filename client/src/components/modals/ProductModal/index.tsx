import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectValue, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, ShoppingCart, Database, Pencil, CheckCircle2, Package } from "lucide-react";
import type { ProductModalProps } from "./types";
import { useProductModal } from "./hooks";

export default function ProductModal(props: ProductModalProps) {
  const { open, onOpenChange, product } = props;
  const h = useProductModal(props);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {product ? (
              <>
                <Pencil className="h-5 w-5" />
                Edit Product
              </>
            ) : (
              <>
                <Package className="h-5 w-5" />
                Add New Product
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {product
              ? 'Update product information below.'
              : 'Search from S&S Activewear, SAGE, or SanMar catalogs, or enter details manually.'
            }
          </DialogDescription>
        </DialogHeader>

        {!product && (
          <Tabs value={h.activeTab} onValueChange={h.setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="manual" className="flex items-center gap-2">
                <Pencil className="h-4 w-4" />
                Manual
              </TabsTrigger>
              <TabsTrigger value="ss-activewear" className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                S&S
              </TabsTrigger>
              <TabsTrigger value="sage" className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                SAGE
              </TabsTrigger>
              <TabsTrigger value="sanmar" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                SanMar
              </TabsTrigger>
            </TabsList>

            {/* S&S Activewear Search Tab */}
            <TabsContent value="ss-activewear" className="space-y-4 mt-4">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5 text-blue-600" />
                      Search S&S Activewear Catalog
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Enter SKU, style code, or product name to search the S&S Activewear catalog.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        placeholder="Enter SKU, style code, or product name (e.g., 3001, Gildan)"
                        value={h.searchQuery}
                        onChange={(e) => h.setSearchQuery(e.target.value)}
                        onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); h.handleSearch(); } }}
                      />
                    </div>
                    <Button onClick={h.handleSearch} disabled={h.isSearching || !h.searchQuery.trim()}>
                      {h.isSearching ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Searching...</>
                      ) : (
                        <><Search className="w-4 h-4 mr-2" />Search</>
                      )}
                    </Button>
                  </div>
                  {h.searchError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-600">{h.searchError}</p>
                    </div>
                  )}
                  {h.searchResults.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Search Results</Label>
                        <Badge variant="secondary">{h.searchResults.length} found</Badge>
                      </div>
                      <div className="max-h-96 overflow-y-auto space-y-2">
                        {h.searchResults.map((p) => (
                          <Card key={p.sku} className="cursor-pointer hover:bg-accent transition-colors" onClick={() => h.selectProduct(p)}>
                            <CardContent className="p-4">
                              <div className="flex items-center gap-4">
                                {p.colorFrontImage && (
                                  <img src={p.colorFrontImage} alt={`${p.brandName} ${p.styleName}`} className="w-20 h-20 object-cover rounded border" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-sm truncate">{p.brandName} {p.styleName}</div>
                                  <div className="text-sm text-muted-foreground">{p.colorName} &bull; Size: {p.sizeName}</div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className="text-xs">SKU: {p.sku}</Badge>
                                    <Badge className="bg-green-100 text-green-800 text-xs">${p.piecePrice}</Badge>
                                  </div>
                                </div>
                                <Button size="sm" variant="default"><CheckCircle2 className="h-4 w-4 mr-1" />Import</Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* SAGE Search Tab */}
            <TabsContent value="sage" className="space-y-4 mt-4">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                      <Database className="h-5 w-5 text-purple-600" />
                      Search SAGE Catalog
                    </h3>
                    <p className="text-sm text-muted-foreground">Enter product name or SKU to search the SAGE catalog.</p>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        placeholder="Enter product name or SKU"
                        value={h.sageSearchQuery}
                        onChange={(e) => h.setSageSearchQuery(e.target.value)}
                        onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); h.handleSageSearch(); } }}
                      />
                    </div>
                    <Button onClick={h.handleSageSearch} disabled={h.isSearching || !h.sageSearchQuery.trim()}>
                      {h.isSearching ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Searching...</>
                      ) : (
                        <><Search className="w-4 h-4 mr-2" />Search</>
                      )}
                    </Button>
                  </div>
                  {h.searchError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-600">{h.searchError}</p>
                    </div>
                  )}
                  {h.sageSearchResults.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Search Results</Label>
                        <Badge variant="secondary">{h.sageSearchResults.length} found</Badge>
                      </div>
                      <div className="max-h-96 overflow-y-auto space-y-2">
                        {h.sageSearchResults.map((p) => (
                          <Card key={p.id} className="cursor-pointer hover:bg-accent transition-colors" onClick={() => h.selectSageProduct(p)}>
                            <CardContent className="p-4">
                              <div className="flex items-center gap-4">
                                {p.imageUrl && (
                                  <img src={p.imageUrl} alt={p.name} className="w-20 h-20 object-cover rounded border" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-sm truncate">{p.name}</div>
                                  {p.description && <div className="text-sm text-muted-foreground line-clamp-1">{p.description}</div>}
                                  <div className="flex flex-wrap items-center gap-2 mt-1">
                                    <Badge variant="outline" className="text-xs">SKU: {p.sku}</Badge>
                                    {p.price && <Badge className="bg-green-100 text-green-800 text-xs">${p.price}</Badge>}
                                    {p.brand && <Badge variant="secondary" className="text-xs">{p.brand}</Badge>}
                                    {p.category && <Badge variant="outline" className="text-xs">{p.category}</Badge>}
                                  </div>
                                  {p.colors && p.colors.length > 0 && (
                                    <div className="flex flex-wrap items-center gap-1 mt-2">
                                      <span className="text-xs text-muted-foreground font-medium">Colors:</span>
                                      {p.colors.slice(0, 5).map((color, idx) => (
                                        <Badge key={idx} variant="secondary" className="text-xs">{color}</Badge>
                                      ))}
                                      {p.colors.length > 5 && <span className="text-xs text-muted-foreground">+{p.colors.length - 5} more</span>}
                                    </div>
                                  )}
                                  {(p.supplierName || p.asiNumber) && (
                                    <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t">
                                      {p.supplierName && (
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                          <Package className="h-3 w-3" />
                                          <span className="font-medium">Supplier:</span>
                                          <span>{p.supplierName}</span>
                                        </div>
                                      )}
                                      {p.asiNumber && <Badge variant="outline" className="text-xs">ASI: {p.asiNumber}</Badge>}
                                      {p.supplierId && <Badge variant="outline" className="text-xs">ID: {p.supplierId}</Badge>}
                                    </div>
                                  )}
                                </div>
                                <Button size="sm" variant="default"><CheckCircle2 className="h-4 w-4 mr-1" />Import</Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* SanMar Search Tab */}
            <TabsContent value="sanmar" className="space-y-4 mt-4">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                      <Package className="h-5 w-5 text-orange-600" />
                      Search SanMar Catalog
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Enter a style number for fastest results (e.g., PC54, 5000, G500), or a brand name (e.g., OGIO, Port Authority).
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        placeholder="Style # (PC54, 5000) or brand name (OGIO)"
                        value={h.sanmarSearchQuery}
                        onChange={(e) => h.setSanmarSearchQuery(e.target.value)}
                        onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); h.handleSanmarSearch(); } }}
                      />
                    </div>
                    <Button onClick={h.handleSanmarSearch} disabled={h.isSearching || !h.sanmarSearchQuery.trim()}>
                      {h.isSearching ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Searching...</>
                      ) : (
                        <><Search className="w-4 h-4 mr-2" />Search</>
                      )}
                    </Button>
                  </div>
                  {h.searchError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-600">{h.searchError}</p>
                    </div>
                  )}
                  {h.sanmarSearchResults.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Search Results</Label>
                        <Badge variant="secondary">{h.sanmarSearchResults.length} found</Badge>
                      </div>
                      <div className="max-h-96 overflow-y-auto space-y-2">
                        {h.sanmarSearchResults.map((p) => (
                          <Card key={p.styleId} className="cursor-pointer hover:bg-accent transition-colors" onClick={() => h.selectSanmarProduct(p)}>
                            <CardContent className="p-4">
                              <div className="flex items-center gap-4">
                                {(p.productImage || p.frontModel || p.thumbnailImage) && (
                                  <img src={p.productImage || p.frontModel || p.thumbnailImage} alt={`${p.brandName} ${p.styleName}`} className="w-20 h-20 object-cover rounded border" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-sm truncate">{p.productTitle || `${p.brandName} ${p.styleName}`}</div>
                                  {p.productDescription && <div className="text-sm text-muted-foreground line-clamp-1">{p.productDescription}</div>}
                                  <div className="flex flex-wrap items-center gap-2 mt-1">
                                    <Badge variant="outline" className="text-xs">Style: {p.styleId}</Badge>
                                    {p.piecePrice ? <Badge className="bg-green-100 text-green-800 text-xs">${p.piecePrice.toFixed(2)}</Badge> : null}
                                    {p.brandName && <Badge variant="secondary" className="text-xs">{p.brandName}</Badge>}
                                    {p.categoryName && <Badge variant="outline" className="text-xs">{p.categoryName}</Badge>}
                                  </div>
                                  {p.colors && p.colors.length > 0 && (
                                    <div className="flex flex-wrap items-center gap-1 mt-2">
                                      <span className="text-xs text-muted-foreground font-medium">Colors:</span>
                                      {p.colors.slice(0, 5).map((color, idx) => (
                                        <Badge key={idx} variant="secondary" className="text-xs">{color}</Badge>
                                      ))}
                                      {p.colors.length > 5 && <span className="text-xs text-muted-foreground">+{p.colors.length - 5} more</span>}
                                    </div>
                                  )}
                                  {p.availableSizes && (
                                    <div className="flex items-center gap-1 mt-1">
                                      <span className="text-xs text-muted-foreground font-medium">Sizes:</span>
                                      <span className="text-xs text-muted-foreground">{p.availableSizes}</span>
                                    </div>
                                  )}
                                </div>
                                <Button size="sm" variant="default"><CheckCircle2 className="h-4 w-4 mr-1" />Import</Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="manual" className="mt-4">
              {/* Form content will be here */}
            </TabsContent>
          </Tabs>
        )}

        <form onSubmit={h.handleSubmit} className="space-y-6">
          {/* Data Source Indicator */}
          {h.dataSource !== "manual" && !product && (
            <div className={`p-3 rounded-lg flex items-center gap-2 ${
              h.dataSource === "sanmar" ? "bg-orange-50 border border-orange-200" :
              h.dataSource === "sage" ? "bg-purple-50 border border-purple-200" :
              "bg-blue-50 border border-blue-200"
            }`}>
              {h.dataSource === "ss-activewear" && (
                <>
                  <ShoppingCart className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">Imported from S&S Activewear</p>
                    <p className="text-xs text-blue-700">Review and modify the details below before saving.</p>
                  </div>
                </>
              )}
              {h.dataSource === "sage" && (
                <>
                  <Database className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-sm font-medium text-purple-900">Imported from SAGE</p>
                    <p className="text-xs text-purple-700">Review and modify the details below before saving.</p>
                  </div>
                </>
              )}
              {h.dataSource === "sanmar" && (
                <>
                  <Package className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="text-sm font-medium text-orange-900">Imported from SanMar</p>
                    <p className="text-xs text-orange-700">Review and modify the details below before saving.</p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Product Image Upload */}
          <div className="space-y-2">
            <Label htmlFor="productImage">Product Image</Label>
            <div className="flex gap-4 items-start">
              {(h.selectedProductImage || h.imageFile) && (
                <div className="flex-shrink-0">
                  <img
                    src={h.imageFile ? URL.createObjectURL(h.imageFile) : h.selectedProductImage}
                    alt="Product preview"
                    className="w-32 h-32 object-cover rounded-lg border shadow-md"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                  <p className="text-xs text-gray-500 mt-1 text-center">Current Image</p>
                </div>
              )}
              <div className="flex-1 space-y-2">
                <Input
                  id="productImage"
                  type="file"
                  accept="image/*"
                  onChange={(e) => h.handleImageFileChange(e.target.files?.[0])}
                  className="cursor-pointer"
                />
                <p className="text-xs text-muted-foreground">Upload a product image (max 5MB). Supports JPG, PNG, WEBP.</p>
                {(h.selectedProductImage || h.imageFile) && (
                  <Button type="button" variant="outline" size="sm" onClick={h.handleRemoveImage}>
                    Remove Image
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Product Details Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Product Name</Label>
              <Input id="name" value={h.formData.name} onChange={(e) => h.setFormData({ ...h.formData, name: e.target.value })} placeholder="Product name" />
            </div>
            <div>
              <Label htmlFor="sku">SKU</Label>
              <Input id="sku" value={h.formData.sku} onChange={(e) => h.setFormData({ ...h.formData, sku: e.target.value })} placeholder="Product SKU" />
            </div>
            <div>
              <Label htmlFor="price">Price</Label>
              <Input id="price" type="number" step="0.01" value={h.formData.price} onChange={(e) => h.setFormData({ ...h.formData, price: e.target.value })} placeholder="0.00" />
            </div>
            <div>
              <Label htmlFor="brand">Brand</Label>
              <Input id="brand" value={h.formData.brand} onChange={(e) => h.setFormData({ ...h.formData, brand: e.target.value })} placeholder="Brand name" />
            </div>
            <div>
              <Label htmlFor="style">Style</Label>
              <Input id="style" value={h.formData.style} onChange={(e) => h.setFormData({ ...h.formData, style: e.target.value })} placeholder="Style number" />
            </div>
            <div>
              <Label htmlFor="color">Colors</Label>
              <Input id="color" value={h.formData.color} onChange={(e) => h.setFormData({ ...h.formData, color: e.target.value })} placeholder="e.g. Red, Blue, Green (comma-separated)" />
              <p className="text-xs text-muted-foreground mt-1">Separate multiple colors with commas</p>
            </div>
            <div>
              <Label htmlFor="size">Sizes</Label>
              <Input id="size" value={h.formData.size} onChange={(e) => h.setFormData({ ...h.formData, size: e.target.value })} placeholder="e.g. S, M, L, XL (comma-separated)" />
              <p className="text-xs text-muted-foreground mt-1">Separate multiple sizes with commas</p>
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Input id="category" value={h.formData.category} onChange={(e) => h.setFormData({ ...h.formData, category: e.target.value })} placeholder="Product category" />
            </div>
            <div>
              <Label htmlFor="supplier">Supplier *</Label>
              {h.pendingSupplier ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 px-3 py-2 border rounded-md bg-orange-50 border-orange-200">
                      <span className="text-orange-800 font-medium text-sm">{h.pendingSupplier.name}</span>
                      <span className="text-orange-500 text-xs ml-2">(New - will be created on save)</span>
                    </div>
                    <Button type="button" variant="ghost" size="sm" className="text-xs" onClick={h.handleClearPendingSupplier}>Change</Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex gap-2">
                    <Select value={h.formData.supplierId} onValueChange={h.handleSupplierSelect}>
                      <SelectTrigger className="flex-1"><SelectValue placeholder="Select supplier (required)" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="create-new" className="text-swag-primary font-medium">+ Create New Supplier</SelectItem>
                        {h.suppliers.map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id}>{supplier.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {!h.formData.supplierId && <p className="text-xs text-red-500 mt-1">Supplier is required</p>}
                </>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={h.formData.description} onChange={(e) => h.setFormData({ ...h.formData, description: e.target.value })} placeholder="Product description" rows={3} />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={h.handleCancelModal}>Cancel</Button>
            <Button type="submit" disabled={h.createProductIsPending || h.updateProductIsPending || h.isUploadingImage}>
              {(h.createProductIsPending || h.updateProductIsPending || h.isUploadingImage) ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {h.isUploadingImage ? 'Uploading Image...' : (product ? 'Updating...' : 'Adding...')}
                </>
              ) : (
                product ? 'Update Product' : 'Add Product'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>

      {/* Create New Supplier Dialog */}
      <Dialog open={h.isCreatingSupplier} onOpenChange={h.setIsCreatingSupplier}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Supplier</DialogTitle>
            <DialogDescription>Add a new supplier to your database</DialogDescription>
          </DialogHeader>
          <form onSubmit={h.handleNewSupplierSubmit} className="space-y-4">
            <div>
              <Label htmlFor="newSupplierName">Supplier Name *</Label>
              <Input id="newSupplierName" value={h.newSupplierData.name} onChange={(e) => h.setNewSupplierData({ ...h.newSupplierData, name: e.target.value })} placeholder="Enter supplier name..." required />
            </div>
            <div>
              <Label htmlFor="newSupplierEmail">Email</Label>
              <Input id="newSupplierEmail" type="email" value={h.newSupplierData.email} onChange={(e) => h.setNewSupplierData({ ...h.newSupplierData, email: e.target.value })} placeholder="supplier@example.com" />
            </div>
            <div>
              <Label htmlFor="newSupplierPhone">Phone</Label>
              <Input id="newSupplierPhone" value={h.newSupplierData.phone} onChange={(e) => h.setNewSupplierData({ ...h.newSupplierData, phone: e.target.value })} placeholder="(555) 123-4567" />
            </div>
            <div>
              <Label htmlFor="newSupplierWebsite">Website</Label>
              <Input id="newSupplierWebsite" value={h.newSupplierData.website} onChange={(e) => h.setNewSupplierData({ ...h.newSupplierData, website: e.target.value })} placeholder="https://supplier.com" />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={h.handleCancelCreateSupplier}>Cancel</Button>
              <Button type="submit" disabled={h.createSupplierIsPending}>
                {h.createSupplierIsPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</>
                ) : (
                  "Create Supplier"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
