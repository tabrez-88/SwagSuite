import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, Search, Package, Plus, Database, ImageOff } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useSageIntegration } from './hooks';

function SageIntegrationComponent() {
  const {
    searchQuery,
    setSearchQuery,
    isSearching,
    searchResults,
    selectedProduct,
    isDetailModalOpen,
    setIsDetailModalOpen,
    syncingProducts,
    syncedProducts,
    loadingProducts,
    handleSearch,
    handleAddProduct,
    handleViewDetails,
  } = useSageIntegration();

  return (
    <div className="space-y-4">
      {/* Search Section */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Database className="h-5 w-5 text-blue-600" />
                SAGE Product Search
              </CardTitle>
              <CardDescription>
                Search by product name, number, category, or supplier
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="e.g., t-shirts, pens, drinkware..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} disabled={isSearching}>
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isSearching && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-3" />
          <p className="text-sm text-muted-foreground">Searching SAGE catalog...</p>
        </div>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && !isSearching && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Found <strong>{searchResults.length}</strong> product(s)
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {searchResults.map((product) => (
              <Card key={product.productId} className="overflow-hidden hover:shadow-lg transition-shadow group cursor-pointer" onClick={() => handleViewDetails(product)}>
                {/* Product Image */}
                <div className="relative h-40 bg-muted flex items-center justify-center overflow-hidden">
                  {product.imageGallery?.[0] ? (
                    <img
                      src={product.imageGallery[0]}
                      alt={product.productName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={`flex flex-col items-center justify-center text-muted-foreground ${product.imageGallery?.[0] ? 'hidden' : ''}`}>
                    <ImageOff size={32} className="mb-1 opacity-40" />
                    <span className="text-xs opacity-60">No image</span>
                  </div>

                  {/* Category badge */}
                  {product.category && product.category !== 'Uncategorized' && (
                    <Badge variant="secondary" className="absolute top-2 right-2 shadow-sm text-xs">
                      {product.category}
                    </Badge>
                  )}
                </div>

                {/* Product Info */}
                <CardContent className="p-4 space-y-2">
                  <div>
                    <h3 className="font-semibold text-sm line-clamp-1">{product.productName}</h3>
                    <p className="text-xs text-muted-foreground">
                      {product.productNumber && `#${product.productNumber}`}
                      {product.productNumber && product.supplierName && ' \u00B7 '}
                      {product.supplierName}
                    </p>
                  </div>

                  {product.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {product.description}
                    </p>
                  )}

                  {/* Badges */}
                  <div className="flex flex-wrap gap-1">
                    {product.colors && product.colors.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {product.colors.length} color{product.colors.length > 1 ? 's' : ''}
                      </Badge>
                    )}
                    {product.eqpLevel && (
                      <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                        EQP: {product.eqpLevel}
                      </Badge>
                    )}
                    {product.asiNumber && (
                      <Badge variant="outline" className="text-xs">
                        ASI: {product.asiNumber}
                      </Badge>
                    )}
                  </div>

                  {/* Pricing & Action */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    {product.pricingStructure && (product.pricingStructure as any).priceRange ? (
                      <span className="text-sm font-bold text-green-700">
                        ${(product.pricingStructure as any).priceRange}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Price varies</span>
                    )}
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddProduct(product);
                      }}
                      disabled={syncingProducts.has(product.productId)}
                    >
                      {syncingProducts.has(product.productId) ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <>
                          <Plus className="h-3 w-3 mr-1" />
                          Add
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Synced Products */}
      {(syncedProducts && syncedProducts.length > 0 || loadingProducts) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="h-4 w-4 text-muted-foreground" />
              Your SAGE Products ({syncedProducts?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingProducts ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto">
                {syncedProducts!.map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{product.productName}</h4>
                      <p className="text-xs text-muted-foreground truncate">
                        {product.productNumber} {product.brand || 'Unknown Brand'}
                      </p>
                    </div>
                    <Badge variant="secondary" className="ml-2 shrink-0 text-xs">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Synced
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Product Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedProduct?.productName}</DialogTitle>
            <DialogDescription>
              {selectedProduct?.productNumber && `Product #${selectedProduct.productNumber}`}
              {selectedProduct?.productNumber && selectedProduct?.supplierName && ' \u00B7 '}
              {selectedProduct?.supplierName}
            </DialogDescription>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4">
              {/* Product Codes */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <span className="text-xs font-medium text-muted-foreground">SPC Code</span>
                  <p className="text-sm">{selectedProduct.productId}</p>
                </div>
                {selectedProduct.productNumber && (
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">Item Number</span>
                    <p className="text-sm">{selectedProduct.productNumber}</p>
                  </div>
                )}
                {selectedProduct.asiNumber && (
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">ASI Number</span>
                    <p className="text-sm">{selectedProduct.asiNumber}</p>
                  </div>
                )}
                {selectedProduct.supplierId && (
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">Supplier ID</span>
                    <p className="text-sm">{selectedProduct.supplierId}</p>
                  </div>
                )}
              </div>

              {/* Images */}
              {selectedProduct.imageGallery && selectedProduct.imageGallery.length > 0 && (
                <div>
                  <Label className="text-sm font-semibold mb-2 block">Product Images</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedProduct.imageGallery.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt={`${selectedProduct.productName} ${idx + 1}`}
                        className="w-full h-32 object-cover rounded border"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Pricing */}
              {selectedProduct.pricingStructure && (selectedProduct.pricingStructure as any).priceRange && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <Label className="text-sm font-semibold text-green-800">Pricing</Label>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    ${(selectedProduct.pricingStructure as any).priceRange}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Price varies by quantity</p>
                </div>
              )}

              {selectedProduct.description && (
                <div>
                  <Label className="text-sm font-semibold">Description</Label>
                  <p className="text-sm mt-1 text-muted-foreground">{selectedProduct.description}</p>
                </div>
              )}

              {/* Specifications */}
              {(selectedProduct.dimensions || selectedProduct.weight) && (
                <div className="grid grid-cols-2 gap-3 p-4 bg-muted/50 rounded-lg">
                  {selectedProduct.dimensions && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Dimensions:</span> {selectedProduct.dimensions}
                    </div>
                  )}
                  {selectedProduct.weight && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Weight:</span> {selectedProduct.weight}
                    </div>
                  )}
                </div>
              )}

              {/* Colors */}
              {selectedProduct.colors && selectedProduct.colors.length > 0 && (
                <div>
                  <Label className="text-sm font-semibold">Colors</Label>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {selectedProduct.colors.map((color, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">{color}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Features */}
              {selectedProduct.features && selectedProduct.features.length > 0 && (
                <div>
                  <Label className="text-sm font-semibold">Features</Label>
                  <ul className="list-disc list-inside text-sm mt-2 space-y-1 text-muted-foreground">
                    {selectedProduct.features.map((feature, idx) => (
                      <li key={idx}>{feature}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Materials */}
              {selectedProduct.materials && selectedProduct.materials.length > 0 && (
                <div>
                  <Label className="text-sm font-semibold">Materials</Label>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {selectedProduct.materials.map((material, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">{material}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Decoration Methods */}
              {selectedProduct.decorationMethods && selectedProduct.decorationMethods.length > 0 && (
                <div>
                  <Label className="text-sm font-semibold">Decoration Methods</Label>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {selectedProduct.decorationMethods.map((method, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">{method}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* EQP & Certifications */}
              {selectedProduct.eqpLevel && (
                <div>
                  <Label className="text-sm font-semibold">EQP Rating</Label>
                  <Badge className="mt-2 bg-yellow-100 text-yellow-800">{selectedProduct.eqpLevel}</Badge>
                </div>
              )}

              {selectedProduct.complianceCertifications && selectedProduct.complianceCertifications.length > 0 && (
                <div>
                  <Label className="text-sm font-semibold">Certifications</Label>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {selectedProduct.complianceCertifications.map((cert, idx) => (
                      <Badge key={idx} className="bg-green-100 text-green-800 text-xs">{cert}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsDetailModalOpen(false)}>
                  Close
                </Button>
                <Button
                  onClick={() => {
                    handleAddProduct(selectedProduct);
                    setIsDetailModalOpen(false);
                  }}
                  disabled={syncingProducts.has(selectedProduct.productId)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add to Catalog
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export { SageIntegrationComponent as SageIntegration };
export default SageIntegrationComponent;
