import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Box, Search, Plus, DollarSign, Package, Database, ShoppingCart, Trash2, TrendingUp, Eye, Edit, AlertTriangle } from "lucide-react";
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
import { ProductIntegrations } from "@/components/integrations/ProductIntegrations";
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
            Manage your product catalog and S&S Activewear integration
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
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-auto">
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
          {/* <TabsTrigger value="integrations" className="flex items-center gap-2">
            <Database size={16} />
            Other Integrations
          </TabsTrigger> */}
        </TabsList>

        {/* My Catalog Tab */}
        <TabsContent value="my-catalog" className="space-y-4">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20 w-full mb-2" />
                    <Skeleton className="h-3 w-1/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product: Product) => {
                const supplier = suppliers.find((s: Supplier) => s.id === product.supplierId);

                return (
                  <Card key={product.id} className="hover:shadow-lg flex flex-col justify-between transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg text-swag-navy">{product.name}</CardTitle>
                          {product.sku && (
                            <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {product.basePrice && (
                            <Badge className="bg-green-100 text-green-800">
                              <DollarSign size={12} className="mr-1" />
                              {product.basePrice}
                            </Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingProduct(product)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            title="Edit product"
                          >
                            <Edit size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteProduct(product)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Delete product"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        {product.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {product.description}
                          </p>
                        )}

                        {supplier && (
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline">{supplier.name}</Badge>
                          </div>
                        )}

                        {(() => {
                          const colors = parseArrayField(product.colors);
                          return colors.length > 0 && (
                            <div className="space-y-1">
                              <span className="text-xs font-medium text-muted-foreground">Colors:</span>
                              <div className="flex flex-wrap gap-1">
                                {colors.map((color, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {color}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          );
                        })()}

                        {(() => {
                          const imprintMethods = parseArrayField(product.imprintMethods);
                          return imprintMethods.length > 0 && (
                            <div className="space-y-1">
                              <span className="text-xs font-medium text-muted-foreground">Imprint Methods:</span>
                              <div className="flex flex-wrap gap-1">
                                {imprintMethods.map((method, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {method}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      <div className="flex flex-wrap items-center justify-between pt-2 gap-2">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleViewProduct(product)}
                          className="flex-1"
                        >
                          <Eye size={12} className="mr-1" />
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Box className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                  No products found
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {searchQuery
                    ? "Try adjusting your search terms or create a new product."
                    : "Get started by adding your first product using S&S Activewear lookup."
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
        <TabsContent value="popular">
          <PopularProducts />
        </TabsContent>

        {/* S&S Activewear Integration Tab */}
        <TabsContent value="ss-activewear">
          <SsActivewearIntegration />
        </TabsContent>

        {/* SanMar Integration Tab */}
        <TabsContent value="sanmar">
          <SanmarIntegration />
        </TabsContent>

        {/* SAGE Integration Tab */}
        <TabsContent value="sage">
          <SageIntegration />
        </TabsContent>

        {/* ESP/ASI/SAGE Integration Tab */}
        <TabsContent value="integrations">
          <Card className="mb-4">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <Database className="h-5 w-5 text-blue-600" />
                <div>
                  <h4 className="font-semibold text-blue-900">API Integration Required</h4>
                  <p className="text-sm text-blue-700">
                    To search ESP/ASI databases, please configure your API credentials in the Settings → Integrations tab.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <ProductIntegrations />
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
                  <span className="animate-spin mr-2">⏳</span>
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
