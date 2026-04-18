import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Supplier } from "@shared/schema";
import {
  useCreateProduct,
  useUpdateProduct,
  useSearchSSActivewear,
  useSearchSage,
  useSearchSanMar,
} from "@/services/products";
import { useCreateVendor } from "@/services/suppliers";
import { supplierKeys } from "@/services/suppliers/keys";
import * as supplierRequests from "@/services/suppliers/requests";
import { uploadToCloudinary } from "@/services/media-library/requests";
import type {
  ProductModalProps,
  ProductFormData,
  NewSupplierData,
  DataSource,
  SsActivewearProduct,
  SageProduct,
  SanMarProductResult,
} from "./types";

const INITIAL_FORM_DATA: ProductFormData = {
  sku: "",
  name: "",
  description: "",
  price: "",
  supplierId: "",
  category: "",
  brand: "",
  style: "",
  color: "",
  size: "",
};

const INITIAL_SUPPLIER_DATA: NewSupplierData = {
  name: "",
  email: "",
  phone: "",
  website: "",
};

export function useProductModal({ open, onOpenChange, product }: ProductModalProps) {
  const [activeTab, setActiveTab] = useState("manual");
  const [formData, setFormData] = useState<ProductFormData>(INITIAL_FORM_DATA);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sageSearchQuery, setSageSearchQuery] = useState("");
  const [sanmarSearchQuery, setSanmarSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SsActivewearProduct[]>([]);
  const [sageSearchResults, setSageSearchResults] = useState<SageProduct[]>([]);
  const [sanmarSearchResults, setSanmarSearchResults] = useState<SanMarProductResult[]>([]);
  const [selectedProductImage, setSelectedProductImage] = useState<string>("");
  const [dataSource, setDataSource] = useState<DataSource>("manual");
  const [isCreatingSupplier, setIsCreatingSupplier] = useState(false);
  const [newSupplierData, setNewSupplierData] = useState<NewSupplierData>(INITIAL_SUPPLIER_DATA);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [pendingSupplier, setPendingSupplier] = useState<{ name: string; website?: string; email?: string; phone?: string } | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
    enabled: open,
  });

  // Populate form when editing existing product
  useEffect(() => {
    if (product && open) {
      const parseToString = (field: any): string => {
        if (!field) return '';
        if (Array.isArray(field)) return field.join(', ');
        if (typeof field === 'string') {
          try {
            const parsed = JSON.parse(field);
            if (Array.isArray(parsed)) return parsed.join(', ');
          } catch { /* not JSON */ }
          return field;
        }
        return '';
      };

      setFormData({
        sku: product.sku || "",
        name: product.name || "",
        description: product.description || "",
        price: product.basePrice?.toString() || "",
        supplierId: product.supplierId || "",
        category: product.category || "",
        brand: product.brand || "",
        style: "",
        color: parseToString(product.colors),
        size: parseToString(product.sizes),
      });
      setSelectedProductImage(product.imageUrl || "");
      setImageFile(null);
      setIsUploadingImage(false);
    } else if (!product && open) {
      resetForm();
    }
  }, [product, open]);

  const resetForm = () => {
    setFormData(INITIAL_FORM_DATA);
    setSelectedProductImage("");
    setImageFile(null);
    setIsUploadingImage(false);
    setPendingSupplier(null);
    setSearchQuery("");
    setSageSearchQuery("");
    setSanmarSearchQuery("");
    setSearchResults([]);
    setSageSearchResults([]);
    setSanmarSearchResults([]);
    setSearchError("");
    setDataSource("manual");
    setActiveTab("manual");
    const fileInput = document.getElementById('productImage') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleImageUpload = async (file: File): Promise<string> => {
    setIsUploadingImage(true);
    try {
      const data = await uploadToCloudinary(file);
      return data.url;
    } catch (error) {
      setIsUploadingImage(false);
      throw error;
    }
  };

  // Service mutations
  const searchProductMutation = useSearchSSActivewear();
  const searchSageProductMutation = useSearchSage();
  const searchSanmarProductMutation = useSearchSanMar();
  const createSupplierMutation = useCreateVendor();
  const createProductMutation = useCreateProduct();
  const updateProductMutation = useUpdateProduct();

  const handleSearchSuccess = (products: any[], setResults: (r: any[]) => void, selectFn: (p: any) => void, source: string) => {
    setResults(products);
    setSearchError("");
    if (products.length === 0) {
      toast({ title: "No Results", description: `No products found in ${source}`, variant: "destructive" });
    } else if (products.length === 1) {
      selectFn(products[0]);
    } else {
      toast({ title: "Search Results", description: `Found ${products.length} products in ${source}` });
    }
  };

  const handleSearchError = (error: Error) => {
    if (isUnauthorizedError(error)) {
      toast({ title: "Unauthorized", description: "You are logged out. Logging in again...", variant: "destructive" });
      setTimeout(() => { window.location.href = "/api/login"; }, 500);
      return;
    }
    setSearchError(error.message);
    toast({ title: "Product Not Found", description: error.message, variant: "destructive" });
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) { setSearchError("Please enter a search query"); return; }
    setIsSearching(true);
    searchProductMutation.mutate(searchQuery.trim(), {
      onSuccess: (products) => handleSearchSuccess(products, setSearchResults, selectProduct, "S&S Activewear"),
      onError: handleSearchError,
      onSettled: () => setIsSearching(false),
    });
  };

  const handleSageSearch = () => {
    if (!sageSearchQuery.trim()) { setSearchError("Please enter a search query"); return; }
    setIsSearching(true);
    searchSageProductMutation.mutate(sageSearchQuery.trim(), {
      onSuccess: (products) => handleSearchSuccess(products, setSageSearchResults, selectSageProduct, "SAGE"),
      onError: handleSearchError,
      onSettled: () => setIsSearching(false),
    });
  };

  const handleSanmarSearch = () => {
    if (!sanmarSearchQuery.trim()) { setSearchError("Please enter a search query"); return; }
    setIsSearching(true);
    searchSanmarProductMutation.mutate(sanmarSearchQuery.trim(), {
      onSuccess: (products) => handleSearchSuccess(products, setSanmarSearchResults, selectSanmarProduct, "SanMar"),
      onError: handleSearchError,
      onSettled: () => setIsSearching(false),
    });
  };

  const selectSanmarProduct = (p: SanMarProductResult) => {
    const sanmarSupplier = suppliers.find(s =>
      s.name.toLowerCase().includes("sanmar") || s.name.toLowerCase().includes("san mar")
    );
    const imageUrl = p.productImage || p.frontModel || p.frontFlat || p.colorProductImage || p.thumbnailImage || "";
    if (!sanmarSupplier) {
      setPendingSupplier({ name: "SanMar", website: "https://www.sanmar.com", phone: "(800) 426-6399" });
    } else {
      setPendingSupplier(null);
    }
    setFormData({
      sku: p.styleId,
      name: p.productTitle || `${p.brandName} ${p.styleName}`,
      description: p.productDescription || "",
      price: p.piecePrice?.toString() || "",
      supplierId: sanmarSupplier?.id || "pending-new",
      category: p.categoryName || "",
      brand: p.brandName || "",
      style: p.styleName || "",
      color: p.colors?.join(", ") || "",
      size: p.sizes?.join(", ") || "",
    });
    setSelectedProductImage(imageUrl);
    setSanmarSearchResults([]);
    setSanmarSearchQuery("");
    setDataSource("sanmar");
    setActiveTab("manual");
    toast({
      title: "Product Imported from SanMar",
      description: sanmarSupplier
        ? `${p.brandName} ${p.styleName} - All fields auto-filled`
        : `${p.brandName} ${p.styleName} - Supplier "SanMar" will be created on save`,
    });
  };

  const selectProduct = (p: SsActivewearProduct) => {
    const ssSupplier = suppliers.find(s =>
      s.name.toLowerCase().includes("s&s activewear") ||
      s.name.toLowerCase().includes("ss activewear")
    );
    if (!ssSupplier) {
      setPendingSupplier({ name: "S&S Activewear", website: "https://www.ssactivewear.com", email: "support@ssactivewear.com", phone: "(800) 523-2155" });
    } else {
      setPendingSupplier(null);
    }
    setFormData({
      sku: p.sku,
      name: `${p.brandName} ${p.styleName} - ${p.colorName}`,
      description: `${p.brandName} ${p.styleName} in ${p.colorName}, Size: ${p.sizeName}`,
      price: p.piecePrice?.toString() || "",
      supplierId: ssSupplier?.id || "pending-new",
      category: "",
      brand: p.brandName,
      style: p.styleName,
      color: p.colorName,
      size: p.sizeName,
    });
    setSelectedProductImage(p.colorFrontImage || "");
    setSearchResults([]);
    setSearchQuery("");
    setDataSource("ss-activewear");
    setActiveTab("manual");
    toast({
      title: "Product Imported from S&S Activewear",
      description: ssSupplier
        ? `${p.brandName} ${p.styleName} - All fields auto-filled`
        : `${p.brandName} ${p.styleName} - Supplier "S&S Activewear" will be created on save`,
    });
  };

  const selectSageProduct = (p: SageProduct) => {
    let sageSupplier = suppliers.find(s =>
      p.supplierName && s.name.toLowerCase() === p.supplierName.toLowerCase()
    );
    if (!sageSupplier && p.supplierName) {
      sageSupplier = suppliers.find(s =>
        s.name.toLowerCase().includes(p.supplierName!.toLowerCase()) ||
        p.supplierName!.toLowerCase().includes(s.name.toLowerCase())
      );
    }
    if (!sageSupplier && !p.supplierName) {
      sageSupplier = suppliers.find(s => s.name.toLowerCase().includes("sage"));
    }
    if (!sageSupplier) {
      const supplierName = p.supplierName || "SAGE";
      setPendingSupplier({ name: supplierName, website: "https://www.sageworld.com", email: p.supplierName ? "" : "support@sageworld.com" });
    } else {
      setPendingSupplier(null);
    }
    setFormData({
      sku: p.sku || "",
      name: p.name || "",
      description: p.description || "",
      price: p.price != null ? p.price.toString() : "",
      supplierId: sageSupplier?.id || "pending-new",
      category: p.category || "",
      brand: p.brand || p.supplierName || "",
      style: "",
      color: p.colors?.join(", ") || "",
      size: p.sizes?.join(", ") || "",
    });
    setSelectedProductImage(p.imageUrl || "");
    setSageSearchResults([]);
    setSageSearchQuery("");
    setDataSource("sage");
    setActiveTab("manual");
    const supplierLabel = p.supplierName || "SAGE";
    toast({
      title: "Product Imported from SAGE",
      description: sageSupplier
        ? `${p.name} - All fields auto-filled`
        : `${p.name} - Supplier "${supplierLabel}" will be created on save`,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.sku) {
      toast({ title: "Missing Information", description: "Product name and SKU are required", variant: "destructive" });
      return;
    }
    if (!formData.supplierId && !pendingSupplier) {
      toast({ title: "Supplier Required", description: "Please select a supplier or create a new one", variant: "destructive" });
      return;
    }
    try {
      let imageUrl = selectedProductImage;
      if (imageFile) {
        imageUrl = await handleImageUpload(imageFile);
        setSelectedProductImage(imageUrl);
        setImageFile(null);
      }
      let resolvedSupplierId = formData.supplierId;
      if (pendingSupplier) {
        const newSupplier = await supplierRequests.createVendor(pendingSupplier as any);
        resolvedSupplierId = newSupplier.id;
        queryClient.invalidateQueries({ queryKey: supplierKeys.all });
        setPendingSupplier(null);
        toast({ title: "Supplier Created", description: `Supplier "${newSupplier.name}" created successfully` });
      }
      const colorsArray = formData.color ? formData.color.split(',').map(c => c.trim()).filter(c => c) : [];
      const sizesArray = formData.size ? formData.size.split(',').map(s => s.trim()).filter(s => s) : [];
      const productData = {
        sku: formData.sku,
        name: formData.name,
        description: formData.description,
        basePrice: (parseFloat(formData.price) || 0).toString(),
        supplierId: resolvedSupplierId,
        brand: formData.brand || null,
        category: formData.category || null,
        colors: colorsArray.length > 0 ? colorsArray : null,
        sizes: sizesArray.length > 0 ? sizesArray : null,
        imageUrl: imageUrl || undefined,
      };
      const closeAndReset = () => { onOpenChange(false); resetForm(); };
      if (product) {
        updateProductMutation.mutate({ id: product.id, data: productData }, { onSuccess: closeAndReset });
      } else {
        createProductMutation.mutate(productData, { onSuccess: closeAndReset });
      }
    } catch (error) {
      setIsUploadingImage(false);
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to process product", variant: "destructive" });
    }
  };

  const handleNewSupplierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplierData.name) {
      toast({ title: "Validation Error", description: "Supplier name is required", variant: "destructive" });
      return;
    }
    createSupplierMutation.mutate(newSupplierData as any, {
      onSuccess: (newSupplier: any) => {
        setFormData({ ...formData, supplierId: newSupplier.id });
        setIsCreatingSupplier(false);
        setNewSupplierData(INITIAL_SUPPLIER_DATA);
      },
    });
  };

  const handleImageFileChange = (file: File | undefined) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File Too Large", description: "Image must be less than 5MB", variant: "destructive" });
      return;
    }
    setImageFile(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setSelectedProductImage("");
    const input = document.getElementById('productImage') as HTMLInputElement;
    if (input) input.value = '';
  };

  const handleCancelCreateSupplier = () => {
    setIsCreatingSupplier(false);
    setNewSupplierData(INITIAL_SUPPLIER_DATA);
  };

  const handleCancelModal = () => {
    onOpenChange(false);
    resetForm();
  };

  const handleSupplierSelect = (value: string) => {
    if (value === "create-new") {
      setIsCreatingSupplier(true);
    } else {
      setFormData({ ...formData, supplierId: value });
    }
  };

  const handleClearPendingSupplier = () => {
    setPendingSupplier(null);
    setFormData({ ...formData, supplierId: "" });
  };

  return {
    // State
    activeTab,
    setActiveTab,
    formData,
    setFormData,
    isSearching,
    searchError,
    searchQuery,
    setSearchQuery,
    sageSearchQuery,
    setSageSearchQuery,
    sanmarSearchQuery,
    setSanmarSearchQuery,
    searchResults,
    sageSearchResults,
    sanmarSearchResults,
    selectedProductImage,
    dataSource,
    isCreatingSupplier,
    setIsCreatingSupplier,
    newSupplierData,
    setNewSupplierData,
    imageFile,
    isUploadingImage,
    pendingSupplier,
    suppliers,

    // Mutation states
    createProductIsPending: createProductMutation.isPending,
    updateProductIsPending: updateProductMutation.isPending,
    createSupplierIsPending: createSupplierMutation.isPending,

    // Handlers
    handleSearch,
    handleSageSearch,
    handleSanmarSearch,
    selectProduct,
    selectSageProduct,
    selectSanmarProduct,
    handleSubmit,
    handleNewSupplierSubmit,
    handleImageFileChange,
    handleRemoveImage,
    handleCancelCreateSupplier,
    handleCancelModal,
    handleSupplierSelect,
    handleClearPendingSupplier,
  };
}
