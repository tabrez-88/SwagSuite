import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { SsActivewearProduct } from "@shared/schema";
import {
  useSsActivewearBrands,
  useSsActivewearSearch,
  useSsActivewearSync,
  useSsActivewearTestConnection,
  useSsActivewearImport,
} from "@/services/integrations/ss-activewear";

export function useSsActivewearIntegration() {
  const [accountNumber, setAccountNumber] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [styleFilter, setStyleFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<SsActivewearProduct | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [syncingProducts, setSyncingProducts] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const { data: brands, isLoading: loadingBrands, error: brandsError } = useSsActivewearBrands();
  const searchMutation = useSsActivewearSearch();
  const syncProductMutation = useSsActivewearSync();
  const testConnectionMutation = useSsActivewearTestConnection();
  const importMutation = useSsActivewearImport();

  const handleSearch = () => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      toast({ title: "Invalid Search", description: "Please enter at least 2 characters to search", variant: "destructive" });
      return;
    }
    searchMutation.mutate(searchQuery);
  };

  const handleViewDetail = (product: SsActivewearProduct) => {
    setSelectedProduct(product);
    setDetailModalOpen(true);
  };

  const handleAddToCatalog = (product: SsActivewearProduct) => {
    const productId = product.sku;
    setSyncingProducts((prev) => new Set(prev).add(productId));
    syncProductMutation.mutate(
      { products: [product], productId },
      {
        onSuccess: (data) => {
          toast({ title: "Products Added", description: `${data.count ?? 1} product(s) successfully added to catalog` });
        },
        onError: () => toast({ title: "Sync Failed", description: "Failed to add products to catalog", variant: "destructive" }),
        onSettled: () => {
          setSyncingProducts((prev) => {
            const next = new Set(prev);
            next.delete(productId);
            return next;
          });
        },
      },
    );
  };

  const handleTestConnection = () => {
    if (!accountNumber.trim() || !apiKey.trim()) {
      toast({ title: "Missing Credentials", description: "Please enter both account number and API key", variant: "destructive" });
      return;
    }
    testConnectionMutation.mutate(
      { accountNumber, apiKey },
      {
        onSuccess: (data) => {
          if (data.connected) {
            toast({ title: "Connection Successful", description: "Successfully connected to S&S Activewear API" });
          } else {
            toast({ title: "Connection Failed", description: "Unable to connect to S&S Activewear API. Please check your credentials.", variant: "destructive" });
          }
        },
        onError: () => toast({ title: "Connection Error", description: "Failed to test connection to S&S Activewear API", variant: "destructive" }),
      },
    );
  };

  const handleImport = () => {
    if (!accountNumber.trim() || !apiKey.trim()) {
      toast({ title: "Missing Credentials", description: "Please enter both account number and API key", variant: "destructive" });
      return;
    }
    importMutation.mutate(
      { accountNumber, apiKey, styleFilter: styleFilter || undefined },
      {
        onSuccess: () => toast({ title: "Import Started", description: "Product import has been started. You can monitor the progress below." }),
        onError: () => toast({ title: "Import Failed", description: "Failed to start product import", variant: "destructive" }),
      },
    );
  };

  return {
    accountNumber,
    setAccountNumber,
    apiKey,
    setApiKey,
    styleFilter,
    setStyleFilter,
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
    testConnectionMutation,
    importMutation,
    handleSearch,
    handleViewDetail,
    handleAddToCatalog,
    handleTestConnection,
    handleImport,
  };
}
