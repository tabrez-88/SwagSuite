import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { aiSearch } from "@/services/products/requests";
import { useLocation } from "@/lib/wouter-compat";
import type { SearchResult } from "./types";

export function useGlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [, setLocation] = useLocation();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Modal states
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  // Fetch all products and find selected one
  const { data: allProducts = [] } = useQuery<any[]>({
    queryKey: ["/api/products"],
    enabled: isProductModalOpen,
  });

  const selectedProduct = selectedProductId
    ? allProducts.find(p => p.id === selectedProductId)
    : null;

  // Fetch suppliers for ProductDetailModal
  const { data: suppliers = [] } = useQuery<any[]>({
    queryKey: ["/api/suppliers"],
  });

  // AI-powered search mutation
  const searchMutation = useMutation({
    mutationFn: (searchQuery: string) => aiSearch(searchQuery),
    onSuccess: (data: SearchResult[]) => {
      setResults(data || []);
      setIsOpen(true);
    },
    onError: (error) => {
      console.error("Search error:", error);
      setResults([]);
    },
  });

  // Handle search
  const handleSearch = (searchQuery: string) => {
    if (searchQuery.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    searchMutation.mutate(searchQuery.trim());
  };

  // Handle result click
  const handleResultClick = (result: SearchResult) => {
    if (result.type === "order") {
      setLocation(`/projects/${result.id}`);
    } else if (result.type === "product") {
      setSelectedProductId(result.id);
      setIsProductModalOpen(true);
    } else if (result.type === "company") {
      setLocation(`/crm/companies/${result.id}`);
    } else if (result.url) {
      setLocation(result.url);
    }

    setIsOpen(false);
    setQuery("");
    setResults([]);
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.trim()) {
        handleSearch(query);
      } else {
        setResults([]);
        setIsOpen(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleFocus = () => {
    if (results.length > 0) {
      setIsOpen(true);
    }
  };

  const handleProductModalChange = (open: boolean) => {
    setIsProductModalOpen(open);
    if (!open) {
      setSelectedProductId(null);
    }
  };

  const supplierName = selectedProduct && suppliers.find((s: any) => s.id === selectedProduct.supplierId)?.name || "Unknown Supplier";

  return {
    query,
    setQuery,
    results,
    isOpen,
    searchRef,
    inputRef,
    isProductModalOpen,
    selectedProduct,
    supplierName,
    searchMutation,
    handleResultClick,
    handleFocus,
    handleProductModalChange,
  };
}
