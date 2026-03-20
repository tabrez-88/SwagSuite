import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Supplier } from "@shared/schema";

const EMPTY_SUPPLIER = {
  name: "",
  email: "",
  phone: "",
  website: "",
  address: "",
  contactPerson: "",
  paymentTerms: "",
  notes: "",
  isPreferred: false,
  doNotOrder: false,
};

export function useSuppliers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newSupplier, setNewSupplier] = useState({ ...EMPTY_SUPPLIER });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: suppliers, isLoading } = useQuery({
    queryKey: ["/api/suppliers"],
  });

  const createSupplierMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/suppliers", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Supplier created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      setIsCreateModalOpen(false);
      setNewSupplier({ ...EMPTY_SUPPLIER });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create supplier",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newSupplier.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Supplier name is required",
        variant: "destructive",
      });
      return;
    }

    createSupplierMutation.mutate(newSupplier);
  };

  const filteredSuppliers =
    suppliers?.filter(
      (supplier: Supplier) =>
        supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        supplier.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        supplier.contactPerson?.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

  const preferredSuppliers = filteredSuppliers.filter((s: Supplier) => s.isPreferred);
  const doNotOrderSuppliers = filteredSuppliers.filter((s: Supplier) => s.doNotOrder);
  const withContactInfo = suppliers?.filter((s: Supplier) => s.email || s.phone).length || 0;

  return {
    searchQuery,
    setSearchQuery,
    isCreateModalOpen,
    setIsCreateModalOpen,
    newSupplier,
    setNewSupplier,
    suppliers,
    isLoading,
    createSupplierMutation,
    handleSubmit,
    filteredSuppliers,
    preferredSuppliers,
    doNotOrderSuppliers,
    withContactInfo,
  };
}
