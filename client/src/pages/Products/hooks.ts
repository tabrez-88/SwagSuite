import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDeleteProduct } from "@/services/products";
import { supplierKeys } from "@/services/suppliers/keys";
import { productKeys } from "@/services/products/keys";
import type { Product, Supplier } from "./types";

/** Helper function to parse array fields that might be stored as strings or JSON */
export const parseArrayField = (field: any): string[] => {
  if (!field) return [];
  if (Array.isArray(field)) return field.filter(item => item && typeof item === 'string');
  if (typeof field === 'string') {
    try {
      const parsed = JSON.parse(field);
      if (Array.isArray(parsed)) {
        return parsed.filter(item => item && typeof item === 'string');
      }
      return [];
    } catch {
      return field.trim() ? [field.trim()] : [];
    }
  }
  return [];
};

export function useProducts() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [activeTab, setActiveTab] = useState("my-catalog");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: productKeys.all,
  });

  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: supplierKeys.all,
  });

  const deleteProductMutation = useDeleteProduct();

  const handleDeleteProduct = (product: Product) => {
    setProductToDelete(product);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (productToDelete) {
      deleteProductMutation.mutate(productToDelete.id, {
        onSuccess: () => {
          setIsDeleteDialogOpen(false);
          setProductToDelete(null);
        },
      });
    }
  };

  const handleCancelDelete = () => {
    setProductToDelete(null);
    setIsDeleteDialogOpen(false);
  };

  const handleOpenProductModal = () => setIsProductModalOpen(true);

  const handleCloseProductModal = () => {
    setIsProductModalOpen(false);
    setEditingProduct(null);
  };

  const handleViewProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsDetailModalOpen(true);
  };

  const handleEditFromDetail = (product: Product) => {
    setEditingProduct(product);
    setIsDetailModalOpen(false);
  };

  const filteredProducts = products.filter((product: Product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedProductSupplierName = selectedProduct
    ? suppliers.find((s: Supplier) => s.id === selectedProduct.supplierId)?.name
    : undefined;

  return {
    // State
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

    // Data
    products,
    suppliers,
    filteredProducts,
    isLoading,
    selectedProductSupplierName,

    // Mutations
    deleteProductMutation,

    // Handlers
    handleDeleteProduct,
    handleConfirmDelete,
    handleCancelDelete,
    handleOpenProductModal,
    handleCloseProductModal,
    handleViewProduct,
    handleEditFromDetail,
  };
}
