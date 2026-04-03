import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { AlertCircle, Box, Download, ImageOff, Loader2, Package, Search } from 'lucide-react';
import { useSanmarIntegration } from './hooks';

const formatCurrency = (value: number | null | undefined) => {
    if (!value) return 'N/A';
    return `$${value.toFixed(2)}`;
};

export function SanmarIntegration() {
    const {
        searchQuery,
        setSearchQuery,
        selectedProduct,
        detailModalOpen,
        setDetailModalOpen,
        syncingProducts,
        searchMutation,
        syncProductMutation,
        handleSearch,
        handleViewDetail,
        handleAddToCatalog,
    } = useSanmarIntegration();

    return (
        <div className="space-y-4">
            {/* Search Section */}
            <Card>
                <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Package className="h-5 w-5 text-blue-600" />
                                SanMar Product Search
                            </CardTitle>
                            <CardDescription>
                                Search by Style ID (e.g., PC54, ST350) or product name
                            </CardDescription>
                        </div>
                        {searchMutation.data && searchMutation.data.length > 0 && (
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
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <Input
                                placeholder="Enter style ID or search term..."
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
                                Failed to search products. Please check your API credentials in Settings.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Loading State */}
            {searchMutation.isPending && (
                <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-3" />
                    <p className="text-sm text-muted-foreground">Searching SanMar catalog...</p>
                </div>
            )}

            {/* Search Results */}
            {searchMutation.data && searchMutation.data.length > 0 && !searchMutation.isPending && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                            Found <strong>{searchMutation.data.length}</strong> product(s)
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {searchMutation.data.map((product) => (
                            <Card key={product.styleId} className="overflow-hidden hover:shadow-lg transition-shadow group cursor-pointer" onClick={() => handleViewDetail(product)}>
                                {/* Product Image */}
                                <div className="relative h-40 bg-muted flex items-center justify-center overflow-hidden">
                                    {(product.frontModel || product.colorProductImage || product.productImage) ? (
                                        <img
                                            src={product.frontModel || product.colorProductImage || product.productImage}
                                            alt={product.productTitle}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                            }}
                                        />
                                    ) : null}
                                    <div className={`flex flex-col items-center justify-center text-muted-foreground ${(product.frontModel || product.colorProductImage || product.productImage) ? 'hidden' : ''}`}>
                                        <ImageOff size={32} className="mb-1 opacity-40" />
                                        <span className="text-xs opacity-60">No image</span>
                                    </div>

                                    {/* Category badge */}
                                    <Badge variant="secondary" className="absolute top-2 right-2 shadow-sm text-xs">
                                        {product.categoryName}
                                    </Badge>
                                </div>

                                {/* Product Info */}
                                <CardContent className="p-4 space-y-2">
                                    <div>
                                        <h3 className="font-semibold text-sm line-clamp-1">{product.productTitle}</h3>
                                        <p className="text-xs text-muted-foreground">
                                            {product.styleId} &middot; {product.brandName}
                                        </p>
                                    </div>

                                    {product.productDescription && (
                                        <p className="text-xs text-muted-foreground line-clamp-2">
                                            {product.productDescription}
                                        </p>
                                    )}

                                    {/* Colors & Sizes summary */}
                                    <div className="flex flex-wrap gap-1">
                                        {product.colors.length > 0 && (
                                            <Badge variant="secondary" className="text-xs">
                                                {product.colors.length} color{product.colors.length > 1 ? 's' : ''}
                                            </Badge>
                                        )}
                                        {product.sizes.length > 0 && (
                                            <Badge variant="outline" className="text-xs">
                                                {product.sizes.length} size{product.sizes.length > 1 ? 's' : ''}
                                            </Badge>
                                        )}
                                    </div>

                                    {/* Pricing */}
                                    <div className="flex items-center justify-between pt-2 border-t">
                                        <div className="space-y-0.5">
                                            {product.pieceSalePrice && product.pieceSalePrice < product.piecePrice! ? (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold text-red-600">
                                                        {formatCurrency(product.pieceSalePrice)}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground line-through">
                                                        {formatCurrency(product.piecePrice)}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-sm font-bold text-green-700">
                                                    {formatCurrency(product.piecePrice)}
                                                </span>
                                            )}
                                            {product.casePrice && (
                                                <p className="text-xs text-muted-foreground">
                                                    Case: {formatCurrency(product.casePrice)} ({product.caseSize} pcs)
                                                </p>
                                            )}
                                        </div>
                                        <Button
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleAddToCatalog(product);
                                            }}
                                            disabled={syncingProducts.has(product.styleId)}
                                        >
                                            {syncingProducts.has(product.styleId) ? (
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
            {searchMutation.data && searchMutation.data.length === 0 && !searchMutation.isPending && (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <Box className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                            No products found
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            Try a different search term or style ID
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Product Detail Modal */}
            <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{selectedProduct?.productTitle}</DialogTitle>
                        <DialogDescription>
                            {selectedProduct?.styleId} &middot; {selectedProduct?.brandName}
                        </DialogDescription>
                    </DialogHeader>
                    {selectedProduct && (
                        <div className="space-y-4">
                            {(selectedProduct.frontModel || selectedProduct.colorProductImage || selectedProduct.productImage) && (
                                <img
                                    src={selectedProduct.frontModel || selectedProduct.colorProductImage || selectedProduct.productImage}
                                    alt={selectedProduct.productTitle}
                                    className="w-full h-64 object-contain rounded-md bg-muted"
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                    }}
                                />
                            )}

                            <div className="space-y-2">
                                <h3 className="font-semibold text-lg">{selectedProduct.productTitle}</h3>
                                {selectedProduct.productDescription && (
                                    <p className="text-sm text-muted-foreground">
                                        {selectedProduct.productDescription}
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                                <div>
                                    <span className="text-xs font-medium text-muted-foreground">Style ID</span>
                                    <p className="text-sm">{selectedProduct.styleId}</p>
                                </div>
                                <div>
                                    <span className="text-xs font-medium text-muted-foreground">Brand</span>
                                    <p className="text-sm">{selectedProduct.brandName}</p>
                                </div>
                                <div>
                                    <span className="text-xs font-medium text-muted-foreground">Category</span>
                                    <p className="text-sm">{selectedProduct.categoryName}</p>
                                </div>
                                {selectedProduct.pieceWeight && (
                                    <div>
                                        <span className="text-xs font-medium text-muted-foreground">Weight</span>
                                        <p className="text-sm">{selectedProduct.pieceWeight} oz</p>
                                    </div>
                                )}
                                {selectedProduct.caseSize && (
                                    <div>
                                        <span className="text-xs font-medium text-muted-foreground">Case Size</span>
                                        <p className="text-sm">{selectedProduct.caseSize} pieces</p>
                                    </div>
                                )}
                            </div>

                            {selectedProduct.colors.length > 0 && (
                                <div className="space-y-2">
                                    <span className="text-sm font-medium">Available Colors</span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {selectedProduct.colors.map((color, idx) => (
                                            <Badge key={idx} variant="secondary" className="text-xs">{color}</Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {selectedProduct.sizes.length > 0 && (
                                <div className="space-y-2">
                                    <span className="text-sm font-medium">Available Sizes</span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {selectedProduct.sizes.map((size, idx) => (
                                            <Badge key={idx} variant="outline" className="text-xs">{size}</Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center justify-between pt-4 border-t">
                                <div className="space-y-1">
                                    <p className="text-sm font-semibold">
                                        Piece: {formatCurrency(selectedProduct.piecePrice)}
                                    </p>
                                    {selectedProduct.dozenPrice && (
                                        <p className="text-sm text-muted-foreground">
                                            Dozen: {formatCurrency(selectedProduct.dozenPrice)}
                                        </p>
                                    )}
                                    {selectedProduct.casePrice && (
                                        <p className="text-sm text-muted-foreground">
                                            Case: {formatCurrency(selectedProduct.casePrice)}
                                        </p>
                                    )}
                                </div>
                                <Button
                                    onClick={() => handleAddToCatalog(selectedProduct)}
                                    disabled={syncingProducts.has(selectedProduct.styleId)}
                                >
                                    {syncingProducts.has(selectedProduct.styleId) ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            Adding...
                                        </>
                                    ) : (
                                        <>
                                            <Download className="h-4 w-4 mr-2" />
                                            Add to Catalog
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
