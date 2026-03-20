import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Box, CheckCircle, Download, Loader2, Package, Search, ShoppingCart, Weight } from 'lucide-react';
import { useSsActivewearIntegration } from './hooks';

const formatCurrency = (value: string | number | null) => {
  if (!value) return 'N/A';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return `$${num.toFixed(2)}`;
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'completed':
      return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
    case 'running':
      return <Badge className="bg-blue-100 text-blue-800"><Loader2 className="w-3 h-3 mr-1 animate-spin" />Running</Badge>;
    case 'failed':
      return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Failed</Badge>;
    default:
      return <Badge variant="secondary">Pending</Badge>;
  }
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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">S&S Activewear Integration</h2>
        <p className="text-gray-600">Search and add apparel products from S&S Activewear to your catalog.</p>
      </div>

      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Product Search
          </CardTitle>
          <CardDescription>
            Search for products by SKU, style number, brand name, or description
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Brands List */}
          <div>
            <Label className="mb-2 block">Browse by Brand</Label>
            {loadingBrands ? (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading brands from S&S Activewear...
              </div>
            ) : brandsError ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">
                  Failed to load brands. Please check your S&S Activewear credentials in Settings.
                </p>
                <p className="text-xs text-red-600 mt-1">Error: {String(brandsError)}</p>
              </div>
            ) : brands && brands.length > 0 ? (
              <>
                <p className="text-xs text-gray-500 mb-2">{brands.length} brands available</p>
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto border rounded-lg p-2">
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
                      className="text-xs"
                    >
                      {brand.name}
                    </Button>
                  ))}
                </div>
              </>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  Please configure your S&S Activewear credentials in Settings to load available brands.
                </p>
              </div>
            )}
          </div>

          <Separator />

          <div className="flex gap-2">
            <Input
              placeholder="e.g., Gildan 5000, 3001CVC, bella + canvas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button
              onClick={handleSearch}
              disabled={searchMutation.isPending}
            >
              {searchMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Search Results */}
          {searchMutation.isPending && (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-500" />
              <p className="text-gray-600">Searching S&S Activewear catalog...</p>
            </div>
          )}

          {searchMutation.isError && (
            <div className="text-center py-8">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-500" />
              <p className="text-gray-600">Failed to search products. Please check your credentials in Settings.</p>
              <p className="text-xs text-gray-500 mt-2">Error: {String(searchMutation.error)}</p>
            </div>
          )}

          {/* Debug info */}
          {searchMutation.isSuccess && (
            <div className="text-xs text-gray-500 mb-2">
              Status: Success | Data type: {typeof searchMutation.data} | Is Array: {String(Array.isArray(searchMutation.data))} | Length: {Array.isArray(searchMutation.data) ? searchMutation.data.length : 'N/A'}
            </div>
          )}

          {searchMutation.isSuccess && searchMutation.data && Array.isArray(searchMutation.data) && searchMutation.data.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-600">
                  Found <strong>{searchMutation.data.length}</strong> products
                </p>
                {searchMutation.data.length > 0 && (
                  <Button
                    size="sm"
                    onClick={() => syncProductMutation.mutate({ products: searchMutation.data! })}
                    disabled={syncProductMutation.isPending}
                  >
                    {syncProductMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4 mr-2" />
                    )}
                    Add All to Catalog
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto">
                {searchMutation.data.map((product) => (
                  <Card key={product.sku} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      {/* Product Placeholder - S&S blocks CORS for images */}
                      <div className="mb-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 flex flex-col items-center justify-center h-32">
                        <Package className="w-12 h-12 text-blue-400 mb-2" />
                        <p className="text-xs text-gray-600 text-center">{product.brandName}</p>
                      </div>

                      {/* Product Info */}
                      <div className="space-y-2">
                        <div>
                          <h3 className="font-semibold text-sm line-clamp-2">
                            {product.brandName} {product.styleName}
                          </h3>
                          <p className="text-xs text-gray-500">{product.sku}</p>
                        </div>

                        <div className="flex flex-wrap gap-1">
                          <Badge variant="outline" className="text-xs">
                            {product.colorName}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {product.sizeName}
                          </Badge>
                        </div>

                        {/* Price */}
                        <div className="bg-green-50 border border-green-200 rounded p-2">
                          <p className="text-xs text-gray-600">Customer Price</p>
                          <p className="text-lg font-bold text-green-700">
                            {formatCurrency(product.customerPrice)}
                          </p>
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

                        {/* Actions */}
                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewDetail(product)}
                            className="flex-1"
                          >
                            View Details
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleAddToCatalog(product)}
                            disabled={syncingProducts.has(product.sku)}
                            className="flex-1"
                          >
                            {syncingProducts.has(product.sku) ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              'Add to Catalog'
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Product Detail Modal */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedProduct && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">
                  {selectedProduct.brandName} {selectedProduct.styleName}
                </DialogTitle>
                <DialogDescription>
                  SKU: {selectedProduct.sku} | Style ID: {selectedProduct.styleId}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Product Visual - Images blocked by CORS */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-8 flex flex-col items-center justify-center">
                  <Package className="w-16 h-16 text-blue-400 mb-3" />
                  <p className="text-sm text-gray-700 font-medium">{selectedProduct.brandName} {selectedProduct.styleName}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Color: {selectedProduct.colorName} | Size: {selectedProduct.sizeName}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    Images are protected by S&S Activewear
                  </p>
                </div>

                {/* Pricing Section */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4" />
                    Pricing
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-gray-600">Piece Price</p>
                      <p className="text-lg font-bold text-green-700">
                        {formatCurrency(selectedProduct.piecePrice)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Dozen Price</p>
                      <p className="text-lg font-bold text-green-700">
                        {formatCurrency(selectedProduct.dozenPrice)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Case Price</p>
                      <p className="text-lg font-bold text-green-700">
                        {formatCurrency(selectedProduct.casePrice)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Customer Price</p>
                      <p className="text-lg font-bold text-green-700">
                        {formatCurrency(selectedProduct.customerPrice)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Product Specifications */}
                <div>
                  <h3 className="font-semibold mb-3">Specifications</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-start gap-2">
                      <Package className="w-4 h-4 mt-1 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium">Color & Size</p>
                        <p className="text-sm text-gray-600">
                          {selectedProduct.colorName} ({selectedProduct.colorCode}) - {selectedProduct.sizeName} ({selectedProduct.sizeCode})
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Weight className="w-4 h-4 mt-1 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium">Unit Weight</p>
                        <p className="text-sm text-gray-600">
                          {selectedProduct.unitWeight ? `${selectedProduct.unitWeight} oz` : 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Box className="w-4 h-4 mt-1 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium">Case Quantity</p>
                        <p className="text-sm text-gray-600">
                          {selectedProduct.caseQty || 'N/A'} units
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Package className="w-4 h-4 mt-1 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium">Stock Quantity</p>
                        <p className="text-sm text-gray-600">
                          {selectedProduct.qty !== undefined ? `${selectedProduct.qty} available` : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Info */}
                {selectedProduct.countryOfOrigin && (
                  <div>
                    <h3 className="font-semibold mb-2">Additional Information</h3>
                    <p className="text-sm text-gray-600">
                      <strong>Country of Origin:</strong> {selectedProduct.countryOfOrigin}
                    </p>
                  </div>
                )}

                {/* GTIN */}
                {selectedProduct.gtin && (
                  <div>
                    <p className="text-sm text-gray-600">
                      <strong>GTIN:</strong> {selectedProduct.gtin}
                    </p>
                  </div>
                )}

                {/* Add to Catalog Button */}
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={() => handleAddToCatalog(selectedProduct)}
                    disabled={selectedProduct ? syncingProducts.has(selectedProduct.sku) : false}
                    className="flex-1"
                  >
                    {selectedProduct && syncingProducts.has(selectedProduct.sku) ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4 mr-2" />
                    )}
                    Add to Catalog
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setDetailModalOpen(false)}
                  >
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
