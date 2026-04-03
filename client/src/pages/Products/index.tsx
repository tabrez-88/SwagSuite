import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Box, Search, Plus, DollarSign, Package, Database, ShoppingCart, Trash2, TrendingUp, Edit, AlertTriangle, ImageOff } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import ProductModal from "@/components/modals/ProductModal";
import { SsActivewearIntegration } from "@/components/integrations/SsActivewearIntegration";
import { SageIntegration } from "@/components/integrations/SageIntegration";
import { SanmarIntegration } from "@/components/integrations/SanmarIntegration";
import { PopularProducts } from "@/components/shared/PopularProducts";
import { ProductDetailModal } from "@/components/modals/ProductDetailModal";
import { useProducts, parseArrayField } from "./hooks";
import type { Product, Supplier } from "./types";

export default function Products() {
  const {
    searchQuery,
    setSearchQuery,
    isProductModalOpen,
    isDetailModalOpen,
    setIsDetailModalOpen,
    selectedProduct,
    editingProduct,
    setEditingProduct,
    activeTab,
    setActiveTab,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    productToDelete,
    suppliers,
    filteredProducts,
    isLoading,
    selectedProductSupplierName,
    deleteProductMutation,
    handleDeleteProduct,
    handleConfirmDelete,
    handleCancelDelete,
    handleOpenProductModal,
    handleCloseProductModal,
    handleViewProduct,
    handleEditFromDetail,
  } = useProducts();

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-swag-navy">Products</h1>
          <p className="text-muted-foreground">
            Manage your product catalog and supplier integrations
          </p>
        </div>
        <Button
          className="bg-swag-primary hover:bg-swag-primary/90"
          onClick={handleOpenProductModal}
        >
          <Plus className="mr-2" size={16} />
          Add Product
        </Button>
      </div>

      <ProductModal
        open={isProductModalOpen || !!editingProduct}
        onOpenChange={(open) => {
          if (!open) {
            handleCloseProductModal();
          }
        }}
        product={editingProduct}
      />

      <ProductDetailModal
        open={isDetailModalOpen}
        onOpenChange={setIsDetailModalOpen}
        product={selectedProduct}
        supplierName={selectedProductSupplierName}
        onEdit={handleEditFromDetail}
        onDelete={handleDeleteProduct}
      />

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="my-catalog" className="flex items-center gap-2">
            <Package size={16} />
            My Catalog
          </TabsTrigger>
          <TabsTrigger disabled value="popular" className="flex items-center gap-2">
            <TrendingUp size={16} />
            Popular Items
          </TabsTrigger>
          <TabsTrigger value="ss-activewear" className="flex items-center gap-2">
            <ShoppingCart size={16} />
            S&S Activewear
          </TabsTrigger>
          <TabsTrigger value="sanmar" className="flex items-center gap-2">
            <Package size={16} />
            SanMar
          </TabsTrigger>
          <TabsTrigger value="sage" className="flex items-center gap-2">
            <Database size={16} />
            SAGE
          </TabsTrigger>
        </TabsList>

        {/* My Catalog Tab */}
        <TabsContent value="my-catalog" forceMount className="data-[state=inactive]:hidden space-y-4">
          {/* Search and Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
              <Input
                placeholder="Search products by name, description, or SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Badge variant="outline" className="whitespace-nowrap">
              {filteredProducts.length} products
            </Badge>
          </div>

          {/* Products Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="h-40 w-full" />
                  <CardContent className="p-4 space-y-2">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-3 w-1/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map((product: Product) => {
                const supplier = suppliers.find((s: Supplier) => s.id === product.supplierId);

                return (
                  <Card
                    key={product.id}
                    className="overflow-hidden hover:shadow-lg transition-shadow group cursor-pointer"
                    onClick={() => handleViewProduct(product)}
                  >
                    {/* Product Image */}
                    <div className="relative h-40 bg-muted flex items-center justify-center overflow-hidden">
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
                        <ImageOff size={32} className="mb-1 opacity-40" />
                        <span className="text-xs opacity-60">No image</span>
                      </div>

                      {/* Price badge overlay */}
                      {product.basePrice && (
                        <Badge className="absolute top-2 right-2 bg-green-600 text-white shadow-sm">
                          <DollarSign size={12} className="mr-0.5" />
                          {product.basePrice}
                        </Badge>
                      )}

                      {/* Action buttons overlay */}
                      <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-7 w-7 bg-white/90 hover:bg-white shadow-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingProduct(product);
                          }}
                          title="Edit product"
                        >
                          <Edit size={13} />
                        </Button>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-7 w-7 bg-white/90 hover:bg-red-50 text-red-600 shadow-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProduct(product);
                          }}
                          title="Delete product"
                        >
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    </div>

                    {/* Product Info */}
                    <CardContent className="p-4 space-y-2">
                      <div>
                        <h3 className="font-semibold text-sm line-clamp-1">{product.name}</h3>
                        {product.sku && (
                          <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                        )}
                      </div>

                      {product.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {product.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-1 pt-1">
                        {supplier && (
                          <Badge variant="outline" className="text-xs">{supplier.name}</Badge>
                        )}
                        {(() => {
                          const colors = parseArrayField(product.colors);
                          return colors.length > 0 ? (
                            <Badge variant="secondary" className="text-xs">
                              {colors.length} color{colors.length > 1 ? 's' : ''}
                            </Badge>
                          ) : null;
                        })()}
                        {(() => {
                          const methods = parseArrayField(product.imprintMethods);
                          return methods.length > 0 ? (
                            <Badge variant="secondary" className="text-xs">
                              {methods.length} imprint{methods.length > 1 ? 's' : ''}
                            </Badge>
                          ) : null;
                        })()}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Box className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                  No products found
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {searchQuery
                    ? "Try adjusting your search terms or create a new product."
                    : "Get started by adding your first product or searching supplier catalogs."
                  }
                </p>
                <Button onClick={handleOpenProductModal} className="bg-swag-primary hover:bg-swag-primary/90">
                  <Plus className="mr-2" size={16} />
                  Add Product
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Popular Products Tab */}
        <TabsContent value="popular" forceMount className="data-[state=inactive]:hidden">
          <PopularProducts />
        </TabsContent>

        {/* S&S Activewear Integration Tab - forceMount prevents remounting/refetching */}
        <TabsContent value="ss-activewear" forceMount className="data-[state=inactive]:hidden">
          <SsActivewearIntegration />
        </TabsContent>

        {/* SanMar Integration Tab */}
        <TabsContent value="sanmar" forceMount className="data-[state=inactive]:hidden">
          <SanmarIntegration />
        </TabsContent>

        {/* SAGE Integration Tab */}
        <TabsContent value="sage" forceMount className="data-[state=inactive]:hidden">
          <SageIntegration />
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Delete Product?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{productToDelete?.name}</strong>?
              {productToDelete?.sku && (
                <span className="block mt-1 text-xs text-gray-500">
                  SKU: {productToDelete.sku}
                </span>
              )}
              <span className="block mt-2 text-red-600 font-medium">
                This action cannot be undone.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDelete}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              disabled={deleteProductMutation.isPending}
            >
              {deleteProductMutation.isPending ? (
                <>
                  <span className="animate-spin mr-2">&#9203;</span>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Product
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
