import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Box, Download, Loader2, Package, Search, ShoppingCart, Weight } from 'lucide-react';
import { useSsActivewearIntegration } from './hooks';

const formatCurrency = (value: string | number | null) => {
  if (!value) return 'N/A';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return `$${num.toFixed(2)}`;
};

export function SsActivewearIntegration() {
  const {
    searchQuery,
    setSearchQuery,
    selectedProduct,
    detailModalOpen,
    setDetailModalOpen,
    syncingProducts,
    brands,
    loadingBrands,
    brandsError,
    searchMutation,
    syncProductMutation,
    handleSearch,
    handleViewDetail,
    handleAddToCatalog,
  } = useSsActivewearIntegration();

  return (
    <div className="space-y-4">
      {/* Search Section */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShoppingCart className="h-5 w-5 text-blue-600" />
                S&S Activewear Product Search
              </CardTitle>
              <CardDescription>
                Search by SKU, style number, brand name, or description
              </CardDescription>
            </div>
            {searchMutation.isSuccess && searchMutation.data && Array.isArray(searchMutation.data) && searchMutation.data.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => syncProductMutation.mutate({ products: searchMutation.data! })}
                disabled={syncProductMutation.isPending}
              >
                {syncProductMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Add All to Catalog
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Brands */}
          {loadingBrands ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading brands from S&S Activewear...
            </div>
          ) : brandsError ? (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
              <p className="text-sm text-red-800">
                Failed to load brands. Please check your S&S Activewear credentials in Settings.
              </p>
            </div>
          ) : brands && brands.length > 0 ? (
            <div>
              <p className="text-xs text-muted-foreground mb-2">{brands.length} brands available</p>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto border rounded-lg p-2">
                {brands.map((brand) => (
                  <Button
                    key={brand.id}
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSearchQuery(brand.name);
                      searchMutation.mutate(brand.name);
                    }}
                    disabled={searchMutation.isPending}
                    className="text-xs h-7"
                  >
                    {brand.name}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <AlertCircle className="h-5 w-5 text-yellow-600 shrink-0" />
              <p className="text-sm text-yellow-800">
                Configure your S&S Activewear credentials in Settings to load available brands.
              </p>
            </div>
          )}

          <Separator />

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="e.g., Gildan 5000, 3001CVC, bella + canvas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={searchMutation.isPending}
            >
              {searchMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              Search
            </Button>
          </div>

          {searchMutation.isError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
              <p className="text-sm text-red-800">
                Failed to search products. Please check your credentials in Settings.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Loading State */}
      {searchMutation.isPending && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-3" />
          <p className="text-sm text-muted-foreground">Searching S&S Activewear catalog...</p>
        </div>
      )}

      {/* Search Results */}
      {searchMutation.isSuccess && searchMutation.data && Array.isArray(searchMutation.data) && searchMutation.data.length > 0 && !searchMutation.isPending && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Found <strong>{searchMutation.data.length}</strong> product(s)
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {searchMutation.data.map((product) => (
              <Card key={product.sku} className="overflow-hidden hover:shadow-lg transition-shadow group cursor-pointer" onClick={() => handleViewDetail(product)}>
                {/* Product Placeholder */}
                <div className="relative h-40 bg-gradient-to-br from-blue-50 to-blue-100 flex flex-col items-center justify-center overflow-hidden">
                  <Package className="w-10 h-10 text-blue-300 mb-1" />
                  <p className="text-xs text-blue-400">{product.brandName}</p>

                  {/* Color badge */}
                  <Badge variant="outline" className="absolute top-2 right-2 bg-white/80 shadow-sm text-xs">
                    {product.colorName}
                  </Badge>
                </div>

                {/* Product Info */}
                <CardContent className="p-4 space-y-2">
                  <div>
                    <h3 className="font-semibold text-sm line-clamp-1">
                      {product.brandName} {product.styleName}
                    </h3>
                    <p className="text-xs text-muted-foreground">{product.sku}</p>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    <Badge variant="secondary" className="text-xs">{product.colorName}</Badge>
                    <Badge variant="outline" className="text-xs">{product.sizeName}</Badge>
                  </div>

                  {/* Stock */}
                  {product.qty !== undefined && product.qty !== null && (
                    <div className="flex items-center gap-1 text-xs">
                      <Package className="w-3 h-3" />
                      <span className={product.qty > 0 ? 'text-green-600' : 'text-red-600'}>
                        {product.qty > 0 ? `${product.qty} in stock` : 'Out of stock'}
                      </span>
                    </div>
                  )}

                  {/* Pricing */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-sm font-bold text-green-700">
                      {formatCurrency(product.customerPrice)}
                    </span>
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCatalog(product);
                      }}
                      disabled={syncingProducts.has(product.sku)}
                    >
                      {syncingProducts.has(product.sku) ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <>
                          <Download className="h-3 w-3 mr-1" />
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

      {/* Empty Results */}
      {searchMutation.isSuccess && searchMutation.data && Array.isArray(searchMutation.data) && searchMutation.data.length === 0 && !searchMutation.isPending && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Box className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">
              No products found
            </h3>
            <p className="text-sm text-muted-foreground">
              Try a different search term, SKU, or brand name
            </p>
          </CardContent>
        </Card>
      )}

      {/* Product Detail Modal */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedProduct && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {selectedProduct.brandName} {selectedProduct.styleName}
                </DialogTitle>
                <DialogDescription>
                  SKU: {selectedProduct.sku} &middot; Style: {selectedProduct.styleId}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Product Visual */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border rounded-lg p-8 flex flex-col items-center justify-center">
                  <Package className="w-16 h-16 text-blue-300 mb-3" />
                  <p className="text-sm font-medium">{selectedProduct.brandName} {selectedProduct.styleName}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedProduct.colorName} &middot; {selectedProduct.sizeName}
                  </p>
                  <p className="text-xs text-muted-foreground/50 mt-2">
                    Images are protected by S&S Activewear
                  </p>
                </div>

                {/* Pricing */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">
                    <ShoppingCart className="w-4 h-4" />
                    Pricing
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Piece Price</p>
                      <p className="text-lg font-bold text-green-700">{formatCurrency(selectedProduct.piecePrice)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Dozen Price</p>
                      <p className="text-lg font-bold text-green-700">{formatCurrency(selectedProduct.dozenPrice)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Case Price</p>
                      <p className="text-lg font-bold text-green-700">{formatCurrency(selectedProduct.casePrice)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Customer Price</p>
                      <p className="text-lg font-bold text-green-700">{formatCurrency(selectedProduct.customerPrice)}</p>
                    </div>
                  </div>
                </div>

                {/* Specifications */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Package className="w-4 h-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Color & Size</p>
                      <p className="text-sm">
                        {selectedProduct.colorName} ({selectedProduct.colorCode}) - {selectedProduct.sizeName} ({selectedProduct.sizeCode})
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Weight className="w-4 h-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Unit Weight</p>
                      <p className="text-sm">{selectedProduct.unitWeight ? `${selectedProduct.unitWeight} oz` : 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Box className="w-4 h-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Case Quantity</p>
                      <p className="text-sm">{selectedProduct.caseQty || 'N/A'} units</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Package className="w-4 h-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Stock Quantity</p>
                      <p className="text-sm">{selectedProduct.qty !== undefined ? `${selectedProduct.qty} available` : 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {selectedProduct.countryOfOrigin && (
                  <p className="text-sm text-muted-foreground">
                    <strong>Country of Origin:</strong> {selectedProduct.countryOfOrigin}
                  </p>
                )}

                {selectedProduct.gtin && (
                  <p className="text-sm text-muted-foreground">
                    <strong>GTIN:</strong> {selectedProduct.gtin}
                  </p>
                )}

                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    onClick={() => handleAddToCatalog(selectedProduct)}
                    disabled={syncingProducts.has(selectedProduct.sku)}
                    className="flex-1"
                  >
                    {syncingProducts.has(selectedProduct.sku) ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4 mr-2" />
                    )}
                    Add to Catalog
                  </Button>
                  <Button variant="outline" onClick={() => setDetailModalOpen(false)}>
                    Close
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
