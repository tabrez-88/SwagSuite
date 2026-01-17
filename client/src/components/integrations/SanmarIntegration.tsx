import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Box, CheckCircle, Download, Loader2, Package, Search } from 'lucide-react';
import { useState } from 'react';

interface SanMarProduct {
    styleId: string;
    styleName: string;
    brandName: string;
    productTitle: string;
    productDescription: string;
    categoryName: string;
    availableSizes: string;
    caseSize: number;
    pieceWeight?: number;

    // Pricing
    casePrice?: number;
    caseSalePrice?: number;
    dozenPrice?: number;
    dozenSalePrice?: number;
    piecePrice?: number;
    pieceSalePrice?: number;
    priceCode?: string;
    priceText?: string;
    saleStartDate?: string;
    saleEndDate?: string;

    // Arrays
    colors: string[];
    sizes: string[];

    // Images
    productImage?: string;
    colorProductImage?: string;
    frontModel?: string;
    backModel?: string;
    sideModel?: string;
    frontFlat?: string;
    backFlat?: string;
    thumbnailImage?: string;
    brandLogoImage?: string;
    specSheet?: string;

    // Other
    keywords?: string;
    productStatus?: string;
}

export function SanmarIntegration() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedProduct, setSelectedProduct] = useState<SanMarProduct | null>(null);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [syncingProducts, setSyncingProducts] = useState<Set<string>>(new Set());
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Search products mutation
    const searchMutation = useMutation({
        mutationFn: async (query: string) => {
            const response = await apiRequest('GET', `/api/sanmar/search?q=${encodeURIComponent(query)}`);
            const data = await response.json();
            console.log('SanMar Search Response:', data);
            return data as SanMarProduct[];
        },
        onError: (error: any) => {
            console.error('Search error:', error);
            toast({
                title: "Search Failed",
                description: error.message || "Failed to search SanMar products. Please check your API credentials.",
                variant: "destructive",
            });
        },
    });

    // Sync products mutation
    const syncProductMutation = useMutation({
        mutationFn: async ({ products, productId }: { products: SanMarProduct[], productId?: string }) => {
            if (productId) {
                setSyncingProducts(prev => new Set(prev).add(productId));
            }
            const response = await apiRequest('POST', '/api/sanmar/products/sync', { products });
            const data = await response.json();
            return { data, productId };
        },
        onSuccess: (result: any) => {
            if (result.productId) {
                setSyncingProducts(prev => {
                    const next = new Set(prev);
                    next.delete(result.productId);
                    return next;
                });
            }
            toast({
                title: "Products Added",
                description: `${result.data.count || 1} product(s) successfully added to catalog`,
            });
            queryClient.invalidateQueries({ queryKey: ['/api/products'] });
        },
        onError: (error, variables: any) => {
            if (variables.productId) {
                setSyncingProducts(prev => {
                    const next = new Set(prev);
                    next.delete(variables.productId);
                    return next;
                });
            }
            toast({
                title: "Sync Failed",
                description: "Failed to add products to catalog",
                variant: "destructive",
            });
        },
    });

    const handleSearch = async () => {
        if (!searchQuery.trim() || searchQuery.length < 2) {
            toast({
                title: "Invalid Search",
                description: "Please enter at least 2 characters to search (Style ID or name)",
                variant: "destructive",
            });
            return;
        }
        searchMutation.mutate(searchQuery);
    };

    const handleViewDetail = (product: SanMarProduct) => {
        setSelectedProduct(product);
        setDetailModalOpen(true);
    };

    const handleAddToCatalog = (product: SanMarProduct) => {
        syncProductMutation.mutate({ products: [product], productId: product.styleId });
    };

    const formatCurrency = (value: number | null | undefined) => {
        if (!value) return 'N/A';
        return `$${value.toFixed(2)}`;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        SanMar Integration
                    </CardTitle>
                    <CardDescription>
                        Search and import products from SanMar's catalog using their SOAP API.
                        Configure your credentials in Settings → Integrations.
                    </CardDescription>
                </CardHeader>
            </Card>

            {/* Search Section */}
            <Card>
                <CardHeader>
                    <CardTitle>Search Products</CardTitle>
                    <CardDescription>
                        Search by Style ID (e.g., PC54, ST350) or product name
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-2">
                        <Input
                            placeholder="Enter style ID or search term..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            className="flex-1"
                        />
                        <Button
                            onClick={handleSearch}
                            disabled={searchMutation.isPending}
                        >
                            {searchMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Search className="h-4 w-4" />
                            )}
                            <span className="ml-2">Search</span>
                        </Button>
                    </div>

                    {searchMutation.isError && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                            <AlertCircle className="h-5 w-5 text-red-600" />
                            <p className="text-sm text-red-800">
                                Failed to search products. Please check your API credentials in Settings.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Search Results */}
            {searchMutation.data && searchMutation.data.length > 0 && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Search Results</CardTitle>
                                <CardDescription>
                                    Found {searchMutation.data.length} product(s)
                                </CardDescription>
                            </div>
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
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4">
                            {searchMutation.data.map((product) => (
                                <Card key={product.styleId} className="hover:shadow-md transition-shadow">
                                    <CardContent className="pt-6">
                                        <div className="flex gap-4">
                                            {(product.frontModel || product.colorProductImage || product.productImage) && (
                                                <img
                                                    src={product.frontModel || product.colorProductImage || product.productImage}
                                                    alt={product.productTitle}
                                                    className="w-24 h-24 object-cover rounded-md"
                                                    onError={(e) => {
                                                        e.currentTarget.style.display = 'none';
                                                    }}
                                                />
                                            )}
                                            <div className="flex-1 space-y-2">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <h4 className="font-semibold text-lg">{product.productTitle}</h4>
                                                        <p className="text-sm text-muted-foreground">
                                                            Style: {product.styleId} | Brand: {product.brandName}
                                                        </p>
                                                    </div>
                                                    <Badge variant="secondary">{product.categoryName}</Badge>
                                                </div>

                                                {product.productDescription && (
                                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                                        {product.productDescription}
                                                    </p>
                                                )}

                                                <div className="flex flex-wrap gap-2">
                                                    {product.colors.length > 0 && (
                                                        <div className="flex items-center gap-1">
                                                            <span className="text-xs font-medium">Colors:</span>
                                                            <span className="text-xs text-muted-foreground">
                                                                {product.colors.slice(0, 3).join(', ')}
                                                                {product.colors.length > 3 && ` +${product.colors.length - 3}`}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {product.sizes.length > 0 && (
                                                        <div className="flex items-center gap-1">
                                                            <span className="text-xs font-medium">Sizes:</span>
                                                            <span className="text-xs text-muted-foreground">
                                                                {product.sizes.slice(0, 5).join(', ')}
                                                                {product.sizes.length > 5 && ` +${product.sizes.length - 5}`}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex items-center justify-between pt-2">
                                                    <div className="flex gap-3">
                                                        {product.pieceSalePrice && product.pieceSalePrice < product.piecePrice! && (
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-semibold text-red-600">
                                                                    Sale: {formatCurrency(product.pieceSalePrice)}
                                                                </span>
                                                                <span className="text-xs text-muted-foreground line-through">
                                                                    {formatCurrency(product.piecePrice)}
                                                                </span>
                                                            </div>
                                                        )}
                                                        {!product.pieceSalePrice && (
                                                            <span className="text-sm font-semibold">
                                                                Piece: {formatCurrency(product.piecePrice)}
                                                            </span>
                                                        )}
                                                        {product.dozenPrice && (
                                                            <span className="text-sm text-muted-foreground">
                                                                Dozen: {formatCurrency(product.dozenPrice)}
                                                            </span>
                                                        )}
                                                        {product.casePrice && (
                                                            <span className="text-sm text-muted-foreground">
                                                                Case: {formatCurrency(product.casePrice)} ({product.caseSize} pcs)
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleViewDetail(product)}
                                                        >
                                                            View Details
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleAddToCatalog(product)}
                                                            disabled={syncingProducts.has(product.styleId)}
                                                        >
                                                            {syncingProducts.has(product.styleId) ? (
                                                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                            ) : (
                                                                <Download className="h-4 w-4 mr-2" />
                                                            )}
                                                            Add to Catalog
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {searchMutation.data && searchMutation.data.length === 0 && (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
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
                        <DialogTitle>Product Details</DialogTitle>
                        <DialogDescription>
                            {selectedProduct?.styleId} - {selectedProduct?.brandName}
                        </DialogDescription>
                    </DialogHeader>
                    {selectedProduct && (
                        <div className="space-y-4">
                            {(selectedProduct.frontModel || selectedProduct.colorProductImage || selectedProduct.productImage) && (
                                <img
                                    src={selectedProduct.frontModel || selectedProduct.colorProductImage || selectedProduct.productImage}
                                    alt={selectedProduct.productTitle}
                                    className="w-full h-64 object-contain rounded-md bg-gray-50"
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                    }}
                                />
                            )}

                            <div className="space-y-2">
                                <h3 className="font-semibold text-lg">{selectedProduct.productTitle}</h3>
                                <p className="text-sm text-muted-foreground">
                                    {selectedProduct.productDescription}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="text-sm font-medium">Style ID:</span>
                                    <p className="text-sm text-muted-foreground">{selectedProduct.styleId}</p>
                                </div>
                                <div>
                                    <span className="text-sm font-medium">Brand:</span>
                                    <p className="text-sm text-muted-foreground">{selectedProduct.brandName}</p>
                                </div>
                                <div>
                                    <span className="text-sm font-medium">Category:</span>
                                    <p className="text-sm text-muted-foreground">{selectedProduct.categoryName}</p>
                                </div>
                                {selectedProduct.pieceWeight && (
                                    <div>
                                        <span className="text-sm font-medium">Weight:</span>
                                        <p className="text-sm text-muted-foreground">{selectedProduct.pieceWeight} oz</p>
                                    </div>
                                )}
                                {selectedProduct.caseSize && (
                                    <div>
                                        <span className="text-sm font-medium">Case Size:</span>
                                        <p className="text-sm text-muted-foreground">{selectedProduct.caseSize} pieces</p>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <span className="text-sm font-medium">Available Colors:</span>
                                <div className="flex flex-wrap gap-2">
                                    {selectedProduct.colors.map((color, idx) => (
                                        <Badge key={idx} variant="secondary">{color}</Badge>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <span className="text-sm font-medium">Available Sizes:</span>
                                <div className="flex flex-wrap gap-2">
                                    {selectedProduct.sizes.map((size, idx) => (
                                        <Badge key={idx} variant="outline">{size}</Badge>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t">
                                <div className="space-y-1">
                                    <p className="text-sm font-semibold">
                                        Piece Price: {formatCurrency(selectedProduct.piecePrice)}
                                    </p>
                                    {selectedProduct.dozenPrice && (
                                        <p className="text-sm text-muted-foreground">
                                            Dozen Price: {formatCurrency(selectedProduct.dozenPrice)}
                                        </p>
                                    )}
                                    {selectedProduct.casePrice && (
                                        <p className="text-sm text-muted-foreground">
                                            Case Price: {formatCurrency(selectedProduct.casePrice)}
                                        </p>
                                    )}
                                </div>
                                <Button
                                    onClick={() => handleAddToCatalog(selectedProduct)}
                                    disabled={selectedProduct ? syncingProducts.has(selectedProduct.styleId) : false}
                                >
                                    {selectedProduct && syncingProducts.has(selectedProduct.styleId) ? (
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
